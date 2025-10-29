import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateFileSize, validateFileType, extractTextFromFile } from "@/lib/storage/file-parser";
import { parseResumeTextImproved, createSafeResumeData, createSafeSummaryData } from "@/lib/improved-parser";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Начинаем улучшенную загрузку резюме...");
    
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

    // Извлечение текста из файла
    console.log("📖 Извлекаем текст из файла...");
    const text = await extractTextFromFile(buffer, file.type, file.name);

    if (!text || text.length < 50) {
      return NextResponse.json({
        success: false,
        error: "Файл пустой или слишком короткий для обработки"
      }, { status: 400 });
    }

    console.log(`✅ Текст извлечен, длина: ${text.length} символов`);

    // Парсинг резюме с улучшенным парсером
    console.log("🤖 Начинаем AI парсинг...");
    const parsedData = await parseResumeTextImproved(text);
    console.log("✅ AI парсинг завершен успешно");

    // Проверка на дубликаты
    const supabase = await createAdminClient();
    
    if (parsedData.personal.email || parsedData.personal.phone) {
      console.log("🔍 Проверяем на дубликаты...");
      
      const { data: existingResume } = await supabase
        .from("resumes")
        .select("id, upload_token")
        .or(`email.eq.${parsedData.personal.email},phone.eq.${parsedData.personal.phone}`)
        .limit(1);

      if (existingResume && existingResume.length > 0) {
        console.log("⚠️ Найден дубликат резюме");
        return NextResponse.json({
          success: true,
          isUpdate: true,
          resumeId: existingResume[0].id,
          uploadToken: existingResume[0].upload_token,
          message: "Резюме уже существует. Вы можете обновить его по предоставленной ссылке."
        });
      }
    }

    // Загрузка файла в Supabase Storage
    console.log("💾 Загружаем файл в хранилище...");
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Ошибка загрузки файла:", uploadError);
      return NextResponse.json({
        success: false,
        error: "Не удалось загрузить файл в хранилище",
        details: uploadError.message
      });
    }

    const fileUrl = supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl;
    console.log("✅ Файл загружен в хранилище");

    // Создание безопасных данных для базы
    console.log("🛡️ Подготавливаем данные для базы...");
    const resumeData = createSafeResumeData(parsedData, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileUrl: fileUrl
    });

    // Вставка резюме в базу данных
    console.log("💾 Сохраняем резюме в базу данных...");
    const { data: resume, error: insertError } = await supabase
      .from("resumes")
      .insert(resumeData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Ошибка сохранения резюме:", insertError);
      return NextResponse.json({ 
        success: false,
        error: "Не удалось сохранить резюме в базу данных",
        details: insertError.message
      });
    }

    console.log("✅ Резюме сохранено в базу данных");

    // Создание сводки для быстрого доступа
    console.log("📊 Создаем сводку резюме...");
    const summaryData = createSafeSummaryData(parsedData, resume.id);
    
    const { error: summaryError } = await supabase
      .from("resume_summaries")
      .insert(summaryData);

    if (summaryError) {
      console.error("⚠️ Ошибка создания сводки:", summaryError);
      // Не прерываем процесс из-за ошибки сводки
    } else {
      console.log("✅ Сводка резюме создана");
    }

    // Возвращаем успешный результат
    const result = {
      success: true,
      resumeId: resume.id,
      uploadToken: resumeData.upload_token,
      message: "Резюме успешно загружено и обработано",
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
      }
    };

    console.log("🎉 Загрузка резюме завершена успешно!");
    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Критическая ошибка при загрузке резюме:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка при обработке резюме",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}
