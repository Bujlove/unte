import { createChatCompletion } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Parse resume text into structured data using DeepSeek
 */
export async function parseResumeText(text: string): Promise<ParsedResume> {
  const prompt = `Ты - эксперт по анализу резюме. Проанализируй следующее резюме и извлеки из него структурированную информацию.

Верни ТОЛЬКО валидный JSON в следующем формате:
{
  "personal": {
    "fullName": "string",
    "email": "string | null",
    "phone": "string | null",
    "location": "string | null",
    "birthDate": "string | null",
    "photo": "string | null"
  },
  "professional": {
    "title": "string (желаемая должность)",
    "summary": "string (краткое описание профессионального опыта)",
    "totalExperience": number (лет опыта),
    "skills": {
      "hard": ["string"],
      "soft": ["string"],
      "tools": ["string"]
    }
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string (YYYY-MM)",
      "endDate": "string | null (YYYY-MM or null if current)",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string (YYYY)",
      "endDate": "string (YYYY)"
    }
  ],
  "languages": [
    {
      "language": "string",
      "level": "string (A1, A2, B1, B2, C1, C2, native)"
    }
  ],
  "additional": {
    "certifications": ["string"],
    "publications": ["string"],
    "projects": ["string"]
  }
}

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

