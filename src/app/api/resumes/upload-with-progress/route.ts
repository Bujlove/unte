import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateFileSize, validateFileType, extractTextFromFile } from "@/lib/storage/file-parser";
import { parseResumeTextImproved, createSafeResumeData, createSafeSummaryData } from "@/lib/improved-parser";
import crypto from "crypto";

interface ProcessingStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let resumeId: string | null = null;
  
  try {
    console.log("🚀 Начинаем улучшенную загрузку резюме с прогресс-индикатором...");
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const consentGiven = formData.get("consent") === "true";

    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: "Файл не предоставлен" 
      }, { status: 400 });
    }

    if (!consentGiven) {
      return NextResponse.json({
        success: false,
        error: "Необходимо согласие на обработку данных"
      }, { status: 400 });
    }

    console.log(`📄 Обрабатываем файл: ${file.name}, тип: ${file.type}, размер: ${file.size}`);

    // Валидация файла
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ 
        success: false,
        error: "Файл слишком большой (максимум 10MB)" 
      }, { status: 400 });
    }

    if (!validateFileType(file.type, file.name)) {
      return NextResponse.json({
        success: false,
        error: "Неподдерживаемый формат файла. Поддерживаются: PDF, DOCX, DOC, TXT"
      }, { status: 400 });
    }

    // Конвертация файла в buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Создание хеша файла для кэширования
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
    console.log(`🔑 Хеш файла: ${fileHash}`);

    const supabase = await createAdminClient();

    // Проверка на дубликаты по хешу
    console.log("🔍 Проверяем на дубликаты по хешу файла...");
    const { data: existingResume } = await supabase
      .from("resumes")
      .select("id, upload_token, processing_status, full_name, current_position")
      .eq("file_hash", fileHash)
      .single();

    if (existingResume) {
      console.log("⚠️ Найден дубликат файла по хешу");
      return NextResponse.json({
        success: true,
        isUpdate: true,
        resumeId: existingResume.id,
        uploadToken: existingResume.upload_token,
        message: "Файл уже был обработан ранее",
        summary: {
          fullName: existingResume.full_name,
          position: existingResume.current_position,
          status: existingResume.processing_status
        }
      });
    }

    // Создание записи резюме с начальным статусом
    console.log("💾 Создаем запись резюме в базе данных...");
    const { data: resume, error: createError } = await supabase
      .from("resumes")
      .insert({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_hash: fileHash,
        processing_status: 'pending',
        processing_steps: [],
        file_metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
          content_type: file.type
        },
        status: 'processing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Ошибка создания записи резюме:", createError);
      return NextResponse.json({
        success: false,
        error: "Не удалось создать запись резюме",
        details: createError.message
      });
    }

    resumeId = resume.id;
    console.log(`✅ Запись резюме создана: ${resumeId}`);

    // Обновляем статус на "обработка"
    if (resumeId) {
      await updateProcessingStatus(supabase, resumeId, 'processing', 'file_validation');
    }

    // Извлечение текста из файла
    console.log("📖 Извлекаем текст из файла...");
    const textStartTime = Date.now();
    
    try {
      const text = await extractTextFromFile(buffer, file.type, file.name);
      
      if (!text || text.length < 50) {
        throw new Error("Файл пустой или слишком короткий для обработки");
      }

      console.log(`✅ Текст извлечен, длина: ${text.length} символов`);
      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'processing', 'text_extraction');
      }
      
      // Обновляем метаданные с информацией о тексте
      await supabase
        .from("resumes")
        .update({
          file_metadata: {
            text_length: text.length,
            text_preview: text.substring(0, 200),
            extraction_time: Date.now() - textStartTime
          }
        })
        .eq('id', resumeId);

    } catch (textError) {
      console.error("❌ Ошибка извлечения текста:", textError);
      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'failed', 'text_extraction', textError.message);
      }
      
      return NextResponse.json({
        success: false,
        error: "Не удалось извлечь текст из файла",
        details: textError instanceof Error ? textError.message : 'Unknown error'
      });
    }

    // Загрузка файла в Supabase Storage
    console.log("💾 Загружаем файл в хранилище...");
    const storageStartTime = Date.now();
    
    try {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${resumeId}-${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Ошибка загрузки в хранилище: ${uploadError.message}`);
      }

      const fileUrl = supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl;
      
      // Обновляем запись с URL файла
      await supabase
        .from("resumes")
        .update({
          file_url: fileUrl,
          file_metadata: {
            storage_path: uploadData.path,
            storage_upload_time: Date.now() - storageStartTime
          }
        })
        .eq('id', resumeId);

      console.log("✅ Файл загружен в хранилище");
      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'processing', 'file_storage');
      }

    } catch (storageError) {
      console.error("❌ Ошибка загрузки файла:", storageError);
        if (resumeId) {
          await updateProcessingStatus(supabase, resumeId, 'failed', 'file_storage', storageError.message);
        }
      
      return NextResponse.json({
        success: false,
        error: "Не удалось загрузить файл в хранилище",
        details: storageError instanceof Error ? storageError.message : 'Unknown error'
      });
    }

    // AI парсинг с fallback механизмом
    console.log("🤖 Начинаем AI парсинг...");
    const parsingStartTime = Date.now();
    
    let parsedData;
    let parsingMethod = 'ai';
    
    try {
      // Пытаемся использовать улучшенный AI парсер
      parsedData = await parseResumeTextImproved(text);
      console.log("✅ AI парсинг завершен успешно");
      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'processing', 'ai_parsing');
      }
      
    } catch (aiError) {
      console.warn("⚠️ AI парсинг не удался, используем fallback:", aiError);
      
      // Fallback: простое извлечение базовой информации
      parsedData = await extractBasicInfo(text);
      parsingMethod = 'fallback';
      
      console.log("✅ Fallback парсинг завершен");
      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'processing', 'fallback_parsing');
      }
    }

    // Создание безопасных данных для базы
    console.log("🛡️ Подготавливаем данные для базы...");
    const dataPrepStartTime = Date.now();
    
    try {
      const resumeData = createSafeResumeData(parsedData, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: fileUrl
      });

      // Обновляем запись резюме с парсированными данными
      await supabase
        .from("resumes")
        .update({
          ...resumeData,
          processing_status: 'processing',
          file_metadata: {
            ...resumeData.file_metadata,
            parsing_method: parsingMethod,
            parsing_time: Date.now() - parsingStartTime,
            data_prep_time: Date.now() - dataPrepStartTime
          }
        })
        .eq('id', resumeId);

      console.log("✅ Данные резюме обновлены");
      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'processing', 'data_preparation');
      }

    } catch (dataError) {
      console.error("❌ Ошибка подготовки данных:", dataError);
        if (resumeId) {
          await updateProcessingStatus(supabase, resumeId, 'failed', 'data_preparation', dataError.message);
        }
      
      return NextResponse.json({
        success: false,
        error: "Не удалось подготовить данные для сохранения",
        details: dataError instanceof Error ? dataError.message : 'Unknown error'
      });
    }

    // Создание сводки для быстрого доступа
    console.log("📊 Создаем сводку резюме...");
    const summaryStartTime = Date.now();
    
    try {
      const summaryData = createSafeSummaryData(parsedData, resumeId);
      
      const { error: summaryError } = await supabase
        .from("resume_summaries")
        .insert(summaryData);

      if (summaryError) {
        console.warn("⚠️ Ошибка создания сводки:", summaryError);
        // Не прерываем процесс из-за ошибки сводки
      } else {
        console.log("✅ Сводка резюме создана");
      }

      if (resumeId) {
        await updateProcessingStatus(supabase, resumeId, 'processing', 'summary_creation');
      }

    } catch (summaryError) {
      console.warn("⚠️ Ошибка создания сводки:", summaryError);
      // Продолжаем без сводки
    }

    // Финальное обновление статуса
    const totalTime = Date.now() - startTime;
    await supabase
      .from("resumes")
      .update({
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        status: 'active',
        file_metadata: {
          total_processing_time: totalTime,
          parsing_method: parsingMethod
        }
      })
      .eq('id', resumeId);

    console.log("🎉 Загрузка резюме завершена успешно!");

    // Возвращаем детальный результат
    const result = {
      success: true,
      resumeId: resumeId,
      uploadToken: resumeData.upload_token,
      message: "Резюме успешно загружено и обработано",
      processing: {
        method: parsingMethod,
        totalTime: totalTime,
        steps: [
          { name: "Валидация файла", status: "completed" },
          { name: "Извлечение текста", status: "completed" },
          { name: "Загрузка в хранилище", status: "completed" },
          { name: "AI парсинг", status: parsingMethod === 'ai' ? "completed" : "failed" },
          { name: "Fallback парсинг", status: parsingMethod === 'fallback' ? "completed" : "skipped" },
          { name: "Сохранение данных", status: "completed" },
          { name: "Создание сводки", status: "completed" }
        ]
      },
      summary: {
        fullName: parsedData.personal.fullName || "Не указано",
        position: parsedData.professional.title || "Не указано",
        company: parsedData.experience?.[0]?.company || "Не указано",
        experience: parsedData.professional.totalExperience || 0,
        skills: parsedData.professional.skills.hard?.slice(0, 5) || [],
        location: parsedData.personal.location || "Не указано",
        qualityScore: resumeData.quality_score
      },
      stats: {
        textLength: text.length,
        skillsCount: parsedData.professional.skills.hard?.length || 0,
        experienceCount: parsedData.experience?.length || 0,
        educationCount: parsedData.education?.length || 0,
        languagesCount: parsedData.languages?.length || 0
      },
      tracking: {
        fileHash: fileHash,
        fileUrl: fileUrl,
        processingId: resumeId
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Критическая ошибка при загрузке резюме:", error);
    
    // Обновляем статус на "ошибка" если есть resumeId
    if (resumeId) {
      try {
        if (resumeId) {
          await updateProcessingStatus(supabase, resumeId, 'failed', 'critical_error', error.message);
        }
      } catch (updateError) {
        console.error("❌ Не удалось обновить статус ошибки:", updateError);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка при обработке резюме",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      tracking: {
        resumeId: resumeId,
        processingTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

// Вспомогательная функция для обновления статуса обработки
async function updateProcessingStatus(supabase: any, resumeId: string, status: string, step: string, error?: string) {
  try {
    await supabase.rpc('update_processing_status', {
      resume_id: resumeId,
      status: status,
      step_name: step,
      error_message: error
    });
  } catch (error) {
    console.error("❌ Ошибка обновления статуса:", error);
  }
}

// Fallback функция для извлечения базовой информации
async function extractBasicInfo(text: string) {
  // Простое извлечение базовой информации без AI
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Извлечение email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;
  
  // Извлечение телефона
  const phoneMatch = text.match(/(\+?[0-9\s\-\(\)]{10,})/);
  const phone = phoneMatch ? phoneMatch[1] : null;
  
  // Извлечение имени (первая строка или из email)
  let fullName = lines[0] || '';
  if (email && !fullName) {
    fullName = email.split('@')[0].replace(/[._]/g, ' ');
  }
  
  return {
    personal: {
      fullName: fullName || 'Не указано',
      email: email,
      phone: phone,
      location: null,
      birthDate: null,
      photo: null
    },
    professional: {
      title: 'Не указано',
      summary: 'Информация извлечена автоматически',
      totalExperience: 0,
      skills: {
        hard: [],
        soft: [],
        tools: []
      }
    },
    experience: [],
    education: [],
    languages: [],
    additional: {
      certifications: [],
      publications: [],
      projects: [],
      awards: [],
      interests: []
    }
  };
}
