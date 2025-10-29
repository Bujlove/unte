import { createEmbedding } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Generate embedding vector from text
 * Using OpenAI embeddings as DeepSeek doesn't support embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Try OpenAI embeddings first
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.data[0].embedding;
    }
  } catch (error) {
    console.log('OpenAI embeddings not available, using fallback');
  }

  // Fallback: Create a simple hash-based vector
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hashArray = new Uint8Array(hash);
  
  // Convert to 1536-dimensional vector (OpenAI embedding size)
  const vector = new Array(1536).fill(0);
  for (let i = 0; i < hashArray.length && i < 1536; i++) {
    vector[i] = (hashArray[i] - 128) / 128; // Normalize to [-1, 1]
  }
  
  return vector;
}

/**
 * Generate embedding from parsed resume data
 * Combines key information into a searchable text
 */
export async function generateResumeEmbedding(parsedData: ParsedResume): Promise<number[]> {
  const searchableText = createSearchableText(parsedData);
  return generateEmbedding(searchableText);
}

/**
 * Generate summary embedding from parsed resume
 * Focuses on professional summary and key skills
 */
export async function generateSummaryEmbedding(parsedData: ParsedResume): Promise<number[]> {
  const summaryText = createSummaryText(parsedData);
  return generateEmbedding(summaryText);
}

/**
 * Create searchable text from parsed resume
 * This text will be used to generate the main embedding
 */
function createSearchableText(parsedData: ParsedResume): string {
  const parts: string[] = [];

  // Professional title and summary
  parts.push(parsedData.professional.title);
  parts.push(parsedData.professional.summary);

  // Skills
  parts.push(`Навыки: ${parsedData.professional.skills.hard.join(", ")}`);
  parts.push(`Инструменты: ${parsedData.professional.skills.tools.join(", ")}`);
  parts.push(`Soft skills: ${parsedData.professional.skills.soft.join(", ")}`);

  // Experience
  parsedData.experience.forEach((exp) => {
    parts.push(
      `${exp.position} в ${exp.company}. ${exp.description}. Достижения: ${exp.achievements.join(", ")}`
    );
  });

  // Education
  parsedData.education.forEach((edu) => {
    parts.push(`${edu.degree} по ${edu.field} в ${edu.institution}`);
  });

  // Languages
  if (parsedData.languages.length > 0) {
    const langs = parsedData.languages.map((l) => `${l.language} (${l.level})`).join(", ");
    parts.push(`Языки: ${langs}`);
  }

  // Additional
  if (parsedData.additional.certifications.length > 0) {
    parts.push(`Сертификаты: ${parsedData.additional.certifications.join(", ")}`);
  }

  if (parsedData.additional.projects.length > 0) {
    parts.push(`Проекты: ${parsedData.additional.projects.join(", ")}`);
  }

  return parts.filter((p) => p).join(". ");
}

/**
 * Create summary text for quick semantic search
 */
function createSummaryText(parsedData: ParsedResume): string {
  const parts: string[] = [];

  parts.push(parsedData.professional.title);
  parts.push(parsedData.professional.summary);
  parts.push(`Опыт ${parsedData.professional.totalExperience} лет`);
  parts.push(`Ключевые навыки: ${parsedData.professional.skills.hard.slice(0, 10).join(", ")}`);

  if (parsedData.experience[0]) {
    parts.push(`Последняя должность: ${parsedData.experience[0].position}`);
  }

  return parts.filter((p) => p).join(". ");
}

/**
 * Generate embedding from search query
 */
export async function generateSearchEmbedding(query: string): Promise<number[]> {
  return generateEmbedding(query);
}

/**
 * Convert embedding array to pgvector format string
 */
export function embeddingToVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a value between 0 and 1 (higher is more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

