import { openai } from "./client";
import { ParsedResume } from "@/types/resume";

const SYSTEM_PROMPT = `Ты парсишь резюме. Верни ТОЛЬКО валидный JSON строго по схеме:
{
  "personal": { "fullName": string|null, "email": string|null, "phone": string|null, "location": string|null, "birthDate": string|null, "photo": string|null },
  "professional": { "title": string|null, "summary": string|null, "totalExperience": number, "skills": { "hard": string[], "soft": string[]|null, "tools": string[]|null } },
  "experience": [{ "company": string|null, "position": string|null, "startDate": string|null, "endDate": string|null, "description": string|null, "achievements": string[]|null }] | null,
  "education": [{ "institution": string|null, "degree": string|null, "field": string|null, "startDate": string|null, "endDate": string|null }] | null,
  "languages": [{ "language": string, "level": string }] | null,
  "additional": { "certifications": string[]|null, "publications": string[]|null, "projects": string[]|null }
}`;

export async function parseResumeWithOpenAI(text: string): Promise<ParsedResume> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text.slice(0, 12000) },
    ],
  });

  const content = res.choices[0]?.message?.content || "";
  if (!content) throw new Error("Empty OpenAI response");
  return JSON.parse(content) as ParsedResume;
}


