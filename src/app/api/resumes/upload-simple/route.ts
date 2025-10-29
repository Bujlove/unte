import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/storage/file-parser";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Простая загрузка резюме...");
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const consent = formData.get("consent") as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: "Файл не предоставлен"
      }, { status: 400 });
    }

    if (consent !== "true") {
      return NextResponse.json({
        success: false,
        error: "Необходимо согласие на обработку данных"
      }, { status: 400 });
    }

    // Валидация файла
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: "Неподдерживаемый тип файла. Разрешены: PDF, DOCX, DOC, TXT"
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json({
        success: false,
        error: "Файл слишком большой. Максимальный размер: 10MB"
      }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Создаем запись резюме
    console.log("📝 Создаем запись резюме...");
    const { data: resume, error: createError } = await supabase
      .from("resumes")
      .insert({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'processing',
        consent_given: true,
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 180 дней
      })
      .select()
      .single();

    if (createError || !resume) {
      console.error("❌ Ошибка создания записи:", createError);
      return NextResponse.json({
        success: false,
        error: "Не удалось создать запись резюме",
        details: createError?.message
      }, { status: 500 });
    }

    console.log(`✅ Запись создана: ${resume.id}`);

    // 2. Извлекаем текст
    console.log("📖 Извлекаем текст...");
    let text: string;
    try {
      text = await extractTextFromFile(buffer, file.type, file.name);
      
      if (!text || text.length < 10) {
        throw new Error("Не удалось извлечь текст из файла");
      }

      console.log(`✅ Текст извлечен: ${text.length} символов`);
    } catch (textError) {
      console.error("❌ Ошибка извлечения текста:", textError);
      
      await supabase
        .from("resumes")
        .update({ 
          status: 'failed',
          processing_error: textError instanceof Error ? textError.message : 'Unknown error'
        })
        .eq('id', resume.id);

      return NextResponse.json({
        success: false,
        error: "Не удалось извлечь текст из файла",
        details: textError instanceof Error ? textError.message : 'Unknown error'
      }, { status: 400 });
    }

    // 3. Загружаем файл в хранилище
    console.log("💾 Загружаем файл...");
    let fileUrl: string;
    try {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${resume.id}-${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      fileUrl = supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl;
      console.log(`✅ Файл загружен: ${fileUrl}`);
    } catch (storageError) {
      console.error("❌ Ошибка загрузки файла:", storageError);
      
      await supabase
        .from("resumes")
        .update({ 
          status: 'failed',
          processing_error: storageError instanceof Error ? storageError.message : 'Storage error'
        })
        .eq('id', resume.id);

      return NextResponse.json({
        success: false,
        error: "Не удалось загрузить файл",
        details: storageError instanceof Error ? storageError.message : 'Storage error'
      }, { status: 500 });
    }

    // 4. Простое извлечение базовой информации
    console.log("🔍 Извлекаем базовую информацию...");
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(\+?[0-9\s\-\(\)]{10,})/);
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const fullName = lines[0] || 'Не указано';
    const email = emailMatch ? emailMatch[1] : null;
    const phone = phoneMatch ? phoneMatch[1] : null;

    // 5. Обновляем запись резюме
    console.log("💾 Сохраняем данные...");
    try {
      await supabase
        .from("resumes")
        .update({
          file_url: fileUrl,
          full_name: fullName,
          email: email,
          phone: phone,
          parsed_data: {
            personal: {
              fullName: fullName,
              email: email,
              phone: phone
            },
            professional: {
              title: 'Не указано',
              summary: text.substring(0, 200) + '...',
              totalExperience: 0
            }
          },
          experience_years: 0,
          last_position: 'Не указано',
          summary: text.substring(0, 200) + '...',
          status: 'completed',
          quality_score: 0.8
        })
        .eq('id', resume.id);

      // 6. Создаем резюме-сумму
      console.log("📋 Создаем резюме-сумму...");
      await supabase
        .from("resume_summaries")
        .insert({
          resume_id: resume.id,
          quick_id: `RS-${Date.now()}`,
          full_name: fullName,
          email: email,
          phone: phone,
          current_position: 'Не указано',
          experience_years: 0,
          summary: text.substring(0, 200) + '...',
          quality_score: 0.8,
          consent_given: true,
          expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        });

      console.log("✅ Данные сохранены успешно");

      return NextResponse.json({
        success: true,
        message: "Резюме успешно загружено и обработано",
        resumeId: resume.id,
        fileName: file.name,
        textLength: text.length,
        textPreview: text.substring(0, 200) + '...',
        fileUrl: fileUrl,
        parsedData: {
          fullName: fullName,
          email: email,
          phone: phone,
          position: 'Не указано',
          experience: 0
        }
      });

    } catch (saveError) {
      console.error("❌ Ошибка сохранения данных:", saveError);
      
      await supabase
        .from("resumes")
        .update({ 
          status: 'failed',
          processing_error: saveError instanceof Error ? saveError.message : 'Save error'
        })
        .eq('id', resume.id);

      return NextResponse.json({
        success: false,
        error: "Не удалось сохранить данные",
        details: saveError instanceof Error ? saveError.message : 'Save error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}