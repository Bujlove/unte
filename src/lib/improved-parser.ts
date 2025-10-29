import { ParsedResume } from "@/types/resume";
import { createChatCompletion } from "./deepseek/client";

/**
 * Улучшенный парсер резюме с лучшей обработкой ошибок
 */
export async function parseResumeTextImproved(text: string): Promise<ParsedResume> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Попытка парсинга ${attempt}/${maxRetries}`);
      
      const prompt = `Ты - эксперт по анализу резюме. Проанализируй следующий текст резюме и извлеки из него максимально подробную структурированную информацию.

ВАЖНО: 
- Будь очень внимательным к деталям
- Извлекай ВСЕ возможные данные, даже если они написаны в разных форматах
- Если информация не найдена, используй null
- Если имя не найдено, попробуй найти в email или других местах
- Если должность не указана, попробуй определить по опыту работы
- Будь гибким в интерпретации данных

Верни ТОЛЬКО валидный JSON в следующем формате:
{
  "personal": {
    "fullName": "string (полное имя)",
    "email": "string | null (email адрес)",
    "phone": "string | null (номер телефона)",
    "location": "string | null (город, страна)",
    "birthDate": "string | null (дата рождения)",
    "photo": "string | null (ссылка на фото)"
  },
  "professional": {
    "title": "string (желаемая должность или текущая позиция)",
    "summary": "string (краткое описание профессионального опыта 2-3 предложения)",
    "totalExperience": number (общий опыт работы в годах),
    "skills": {
      "hard": ["string"] (технические навыки: языки программирования, фреймворки, технологии),
      "soft": ["string"] (мягкие навыки: лидерство, коммуникация, управление),
      "tools": ["string"] (инструменты: IDE, системы, платформы)
    }
  },
  "experience": [
    {
      "company": "string (название компании)",
      "position": "string (должность)",
      "startDate": "string (YYYY-MM)",
      "endDate": "string | null (YYYY-MM или null если текущая работа)",
      "description": "string (описание обязанностей)",
      "achievements": ["string"] (ключевые достижения и результаты)
    }
  ],
  "education": [
    {
      "institution": "string (учебное заведение)",
      "degree": "string (степень)",
      "field": "string (специальность)",
      "startDate": "string (YYYY-MM)",
      "endDate": "string | null (YYYY-MM)",
      "gpa": "string | null (средний балл)",
      "description": "string | null (дополнительная информация)"
    }
  ],
  "languages": [
    {
      "name": "string (название языка)",
      "level": "string (уровень владения: A1, A2, B1, B2, C1, C2, Native, Fluent, Intermediate, Basic)",
      "certification": "string | null (сертификат)"
    }
  ],
  "additional": {
    "certifications": [
      {
        "name": "string (название сертификата)",
        "issuer": "string (организация)",
        "date": "string (YYYY-MM)",
        "expiry": "string | null (YYYY-MM)"
      }
    ],
    "publications": [
      {
        "title": "string (название)",
        "type": "string (тип: статья, книга, патент)",
        "date": "string (YYYY-MM)",
        "description": "string | null (описание)"
      }
    ],
    "projects": [
      {
        "name": "string (название проекта)",
        "description": "string (описание)",
        "technologies": ["string"] (использованные технологии),
        "url": "string | null (ссылка)",
        "startDate": "string (YYYY-MM)",
        "endDate": "string | null (YYYY-MM)"
      }
    ],
    "awards": [
      {
        "name": "string (название награды)",
        "issuer": "string (организация)",
        "date": "string (YYYY-MM)",
        "description": "string | null (описание)"
      }
    ],
    "interests": ["string"] (интересы и хобби)
  }
}

Текст резюме:
${text}`;

      const response = await createChatCompletion([
        {
          role: "user",
          content: prompt
        }
      ]);

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error("Пустой ответ от AI");
      }

      // Очистка ответа от markdown
      let jsonText = response.choices[0].message.content?.trim() || '';
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedData = JSON.parse(jsonText) as ParsedResume;
      
      // Валидация данных
      const hasPersonalInfo = parsedData.personal.fullName || parsedData.personal.email || parsedData.personal.phone;
      const hasProfessionalInfo = parsedData.professional.title || 
        (parsedData.professional.skills.hard && parsedData.professional.skills.hard.length > 0) || 
        (parsedData.experience && parsedData.experience.length > 0);
      const hasAnyData = hasPersonalInfo || hasProfessionalInfo || 
        (parsedData.education && parsedData.education.length > 0);

      if (!hasAnyData) {
        throw new Error('Не удалось извлечь значимые данные из резюме');
      }

      console.log(`✅ Парсинг успешен на попытке ${attempt}`);
      console.log(`📊 Извлечено: имя=${parsedData.personal.fullName}, email=${parsedData.personal.email}, навыки=${parsedData.professional.skills.hard?.length || 0}`);
      
      return parsedData;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Неизвестная ошибка');
      console.error(`❌ Попытка ${attempt} не удалась:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // Увеличиваем задержку с каждой попыткой
        console.log(`⏳ Ожидание ${delay}ms перед следующей попыткой...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Не удалось распарсить резюме после ${maxRetries} попыток. Последняя ошибка: ${lastError?.message}`);
}

/**
 * Создает безопасные данные для вставки в базу данных
 */
export function createSafeResumeData(parsedData: ParsedResume, fileInfo: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string | null;
}) {
  // Безопасное извлечение навыков
  const allSkills = [
    ...(parsedData.professional.skills.hard || []),
    ...(parsedData.professional.skills.soft || []),
    ...(parsedData.professional.skills.tools || [])
  ].filter(Boolean);

  // Безопасное извлечение языков
  const languages = (parsedData.languages || [])
    .map(lang => typeof lang === 'string' ? lang : (lang as any).name || (lang as any).language || '')
    .filter(Boolean);

  // Очистка parsed_data для JSONB
  const cleanParsedData = {
    ...parsedData,
    experience: parsedData.experience && parsedData.experience.length > 0 ? parsedData.experience : null,
    education: parsedData.education && parsedData.education.length > 0 ? parsedData.education : null,
    languages: parsedData.languages && parsedData.languages.length > 0 ? parsedData.languages : null,
    additional: {
      ...parsedData.additional,
      certifications: parsedData.additional.certifications && parsedData.additional.certifications.length > 0 ? parsedData.additional.certifications : null,
      publications: parsedData.additional.publications && parsedData.additional.publications.length > 0 ? parsedData.additional.publications : null,
      projects: parsedData.additional.projects && parsedData.additional.projects.length > 0 ? parsedData.additional.projects : null,
    },
    professional: {
      ...parsedData.professional,
      skills: {
        ...parsedData.professional.skills,
        soft: parsedData.professional.skills.soft && parsedData.professional.skills.soft.length > 0 ? parsedData.professional.skills.soft : null,
        tools: parsedData.professional.skills.tools && parsedData.professional.skills.tools.length > 0 ? parsedData.professional.skills.tools : null,
      }
    }
  };

  return {
    // Основные поля
    file_url: fileInfo.fileUrl,
    file_name: fileInfo.fileName,
    file_size: fileInfo.fileSize,
    mime_type: fileInfo.mimeType,
    
    // Личная информация
    full_name: parsedData.personal.fullName || null,
    email: parsedData.personal.email || null,
    phone: parsedData.personal.phone || null,
    location: parsedData.personal.location || null,
    
    // Профессиональная информация
    parsed_data: cleanParsedData as any,
    skills: allSkills.length > 0 ? allSkills : null,
    experience_years: parsedData.professional.totalExperience || 0,
    last_position: parsedData.experience?.[0]?.position || null,
    last_company: parsedData.experience?.[0]?.company || null,
    education_level: parsedData.education?.[0]?.degree || null,
    languages: languages.length > 0 ? languages : null,
    
    // Векторные поля (только если есть данные)
    embedding: null, // Пока отключаем векторы
    summary_embedding: null,
    
    // Статус и метаданные
    status: "active",
    quality_score: calculateQualityScore(parsedData),
    upload_token: generateToken(),
    consent_given: true,
  };
}

/**
 * Создает безопасные данные для resume_summaries
 */
export function createSafeSummaryData(parsedData: ParsedResume, resumeId: string) {
  const allSkills = [
    ...(parsedData.professional.skills.hard || []),
    ...(parsedData.professional.skills.soft || []),
    ...(parsedData.professional.skills.tools || [])
  ].filter(Boolean);

  const languages = (parsedData.languages || [])
    .map(lang => lang.name)
    .filter(Boolean);

  return {
    resume_id: resumeId,
    quick_id: `QR-${Date.now()}`,
    full_name: parsedData.personal.fullName || '',
    email: parsedData.personal.email || '',
    phone: parsedData.personal.phone || '',
    location: parsedData.personal.location || '',
    current_position: parsedData.professional.title || '',
    current_company: parsedData.experience?.[0]?.company || '',
    experience_years: parsedData.professional.totalExperience || 0,
    education_level: parsedData.education?.[0]?.degree || '',
    skills: allSkills.length > 0 ? allSkills : [],
    languages: languages.length > 0 ? languages : [],
    summary: parsedData.professional.summary || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Простой расчет качества резюме
 */
function calculateQualityScore(parsedData: ParsedResume): number {
  let score = 0;
  
  // Личная информация (20 баллов)
  if (parsedData.personal.fullName) score += 5;
  if (parsedData.personal.email) score += 5;
  if (parsedData.personal.phone) score += 5;
  if (parsedData.personal.location) score += 5;
  
  // Профессиональная информация (40 баллов)
  if (parsedData.professional.title) score += 10;
  if (parsedData.professional.summary) score += 10;
  if (parsedData.professional.totalExperience > 0) score += 10;
  if (parsedData.professional.skills.hard && parsedData.professional.skills.hard.length > 0) score += 10;
  
  // Опыт работы (30 баллов)
  if (parsedData.experience && parsedData.experience.length > 0) {
    score += Math.min(30, parsedData.experience.length * 10);
  }
  
  // Образование (10 баллов)
  if (parsedData.education && parsedData.education.length > 0) score += 10;
  
  return Math.min(100, score);
}

/**
 * Генерация токена
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
