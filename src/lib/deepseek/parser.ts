import { createChatCompletion } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Parse resume text into structured data using DeepSeek
 */
export async function parseResumeText(text: string): Promise<ParsedResume> {
  const prompt = `Ты - эксперт по анализу резюме. Проанализируй следующее резюме и извлеки из него максимально подробную структурированную информацию.

ВАЖНО: Будь очень внимательным к деталям. Извлекай ВСЕ возможные данные.

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
      "degree": "string (степень: бакалавр, магистр, PhD)",
      "field": "string (специальность)",
      "startDate": "string (YYYY)",
      "endDate": "string (YYYY)"
    }
  ],
  "languages": [
    {
      "language": "string (язык)",
      "level": "string (уровень: A1, A2, B1, B2, C1, C2, native)"
    }
  ],
  "additional": {
    "certifications": ["string"] (сертификаты и курсы),
    "publications": ["string"] (публикации и статьи),
    "projects": ["string"] (личные проекты)
  }
}

ПРАВИЛА ИЗВЛЕЧЕНИЯ:
1. Если информация не найдена, используй null
2. Для дат используй формат YYYY-MM или YYYY
3. Извлекай ВСЕ навыки, даже если они упомянуты в разных местах
4. Для опыта работы считай только релевантный опыт (не стажировки, если не указано иное)
5. Если есть несколько email или телефонов, используй основной
6. Для локации используй формат "Город, Страна"

Резюме:
${text}`;

  const response = await createChatCompletion(
    [
      {
        role: "system",
        content:
          "Ты эксперт по парсингу резюме. Всегда отвечай только валидным JSON без дополнительного текста.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      temperature: 0.3,
      jsonMode: true,
    }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse resume: empty response");
  }

  try {
    const parsed = JSON.parse(content) as ParsedResume;
    return parsed;
  } catch (error) {
    console.error("Failed to parse JSON response:", content);
    throw new Error("Failed to parse resume: invalid JSON response");
  }
}

/**
 * Generate a professional summary from parsed resume data
 */
export async function generateResumeSummary(parsedData: ParsedResume): Promise<string> {
  const prompt = `На основе следующих данных резюме, создай краткое профессиональное описание кандидата (2-3 предложения):

Должность: ${parsedData.professional.title}
Опыт: ${parsedData.professional.totalExperience} лет
Навыки: ${parsedData.professional.skills.hard.join(", ")}
Последняя позиция: ${parsedData.experience[0]?.position || "N/A"} в ${parsedData.experience[0]?.company || "N/A"}

Описание должно быть кратким, профессиональным и подчеркивать ключевые компетенции.`;

  const response = await createChatCompletion([
    {
      role: "system",
      content: "Ты профессиональный HR-консультант. Создавай краткие и точные описания.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  return response.choices[0]?.message?.content || "";
}

/**
 * Calculate resume quality score (0-100)
 */
export function calculateQualityScore(parsedData: ParsedResume): number {
  let score = 0;

  // Contact information (20 points)
  if (parsedData.personal.fullName) score += 5;
  if (parsedData.personal.email) score += 5;
  if (parsedData.personal.phone) score += 5;
  if (parsedData.personal.location) score += 5;

  // Professional info (30 points)
  if (parsedData.professional.title) score += 10;
  if (parsedData.professional.summary) score += 10;
  if (parsedData.professional.skills.hard.length > 0) score += 10;

  // Experience (30 points)
  if (parsedData.experience.length > 0) score += 10;
  if (parsedData.experience.length >= 2) score += 10;
  const hasDetailedExperience = parsedData.experience.some(
    (exp) => exp.achievements.length > 0
  );
  if (hasDetailedExperience) score += 10;

  // Education (10 points)
  if (parsedData.education.length > 0) score += 10;

  // Additional (10 points)
  if (parsedData.languages.length > 0) score += 5;
  if (
    parsedData.additional.certifications.length > 0 ||
    parsedData.additional.projects.length > 0
  )
    score += 5;

  return Math.min(score, 100);
}

/**
 * Extract all skills from parsed resume
 */
export function extractSkills(parsedData: ParsedResume): string[] {
  const skills = [
    ...parsedData.professional.skills.hard,
    ...parsedData.professional.skills.soft,
    ...parsedData.professional.skills.tools,
  ];

  // Remove duplicates and normalize
  return [...new Set(skills.map((s) => s.trim().toLowerCase()))];
}

/**
 * Create summary data for quick access
 */
export function createResumeSummary(parsedData: ParsedResume) {
  // Extract current position from experience
  const currentExperience = parsedData.experience.find(exp => !exp.endDate) || parsedData.experience[0];
  
  // Extract languages
  const languages = parsedData.languages.map(lang => `${lang.language} (${lang.level})`);
  
  // Extract key achievements
  const keyAchievements = parsedData.experience
    .flatMap(exp => exp.achievements)
    .slice(0, 5); // Top 5 achievements
  
  // Determine work type preferences (basic logic)
  const workType = [];
  if (parsedData.personal.location?.toLowerCase().includes('remote') || 
      parsedData.professional.summary?.toLowerCase().includes('remote')) {
    workType.push('remote');
  }
  if (parsedData.professional.summary?.toLowerCase().includes('office') ||
      parsedData.professional.summary?.toLowerCase().includes('офис')) {
    workType.push('office');
  }
  if (workType.length === 0) {
    workType.push('hybrid'); // Default
  }

  return {
    full_name: parsedData.personal.fullName || '',
    email: parsedData.personal.email || '',
    phone: parsedData.personal.phone || '',
    location: parsedData.personal.location || '',
    current_position: currentExperience?.position || parsedData.professional.title || '',
    current_company: currentExperience?.company || '',
    experience_years: parsedData.professional.totalExperience || 0,
    education_level: parsedData.education[0]?.degree || '',
    skills: extractSkills(parsedData),
    languages: languages,
    salary_expectation: '', // Will be extracted by AI if mentioned
    availability: 'immediately', // Default
    work_type: workType,
    summary: parsedData.professional.summary || '',
    key_achievements: keyAchievements
  };
}

/**
 * Enhanced parsing with better error handling and retry logic
 */
export async function parseResumeTextWithRetry(text: string, maxRetries: number = 3): Promise<ParsedResume> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Parsing attempt ${attempt}/${maxRetries}`);
      const result = await parseResumeText(text);
      
      // Validate that we got meaningful data
      if (!result.personal.fullName && !result.professional.title) {
        throw new Error('No meaningful data extracted');
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Parsing attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw new Error(`Failed to parse resume after ${maxRetries} attempts: ${lastError?.message}`);
}

