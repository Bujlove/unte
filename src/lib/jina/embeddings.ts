import { generateEmbeddingWithJina, generateEmbeddingsWithJina } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Generate embedding for resume using Jina AI
 */
export async function generateResumeEmbedding(parsedData: ParsedResume): Promise<number[]> {
  try {
    const searchableText = createSearchableText(parsedData);
    return await generateEmbeddingWithJina(searchableText);
  } catch (error) {
    console.error("Jina embedding generation failed:", error);
    // Fallback to hash-based vector
    return generateHashBasedVector(parsedData);
  }
}

/**
 * Generate embedding for resume summary using Jina AI
 */
export async function generateSummaryEmbedding(parsedData: ParsedResume): Promise<number[]> {
  try {
    const summaryText = createSummaryText(parsedData);
    return await generateEmbeddingWithJina(summaryText);
  } catch (error) {
    console.error("Jina summary embedding generation failed:", error);
    // Fallback to hash-based vector
    return generateHashBasedVector(parsedData);
  }
}

/**
 * Generate embedding for search query using Jina AI
 */
export async function generateSearchEmbedding(query: string): Promise<number[]> {
  try {
    return await generateEmbeddingWithJina(query);
  } catch (error) {
    console.error("Jina search embedding generation failed:", error);
    // Fallback to hash-based vector
    return generateHashBasedVector({ professional: { title: query } } as ParsedResume);
  }
}

/**
 * Generate multiple embeddings for search queries using Jina AI
 */
export async function generateSearchEmbeddings(queries: string[]): Promise<number[][]> {
  try {
    return await generateEmbeddingsWithJina(queries);
  } catch (error) {
    console.error("Jina search embedding generation failed:", error);
    // Fallback to hash-based vectors
    return queries.map(query => generateHashBasedVector({ professional: { title: query } } as ParsedResume));
  }
}

/**
 * Create searchable text from parsed resume data
 */
function createSearchableText(parsedData: ParsedResume): string {
  const parts = [];
  
  // Basic info
  if (parsedData.personal.fullName) parts.push(parsedData.personal.fullName);
  if (parsedData.personal.location) parts.push(parsedData.personal.location);
  
  // Professional info
  if (parsedData.professional.title) parts.push(parsedData.professional.title);
  if (parsedData.professional.summary) parts.push(parsedData.professional.summary);
  
  // Skills
  if (parsedData.professional.skills.hard) {
    parts.push(parsedData.professional.skills.hard.join(' '));
  }
  if (parsedData.professional.skills.soft) {
    parts.push(parsedData.professional.skills.soft.join(' '));
  }
  if (parsedData.professional.skills.tools) {
    parts.push(parsedData.professional.skills.tools.join(' '));
  }
  
  // Experience
  if (parsedData.experience) {
    parsedData.experience.forEach(exp => {
      if (exp.company) parts.push(exp.company);
      if (exp.position) parts.push(exp.position);
      if (exp.description) parts.push(exp.description);
      if (exp.achievements) {
        parts.push(exp.achievements.join(' '));
      }
    });
  }
  
  // Education
  if (parsedData.education) {
    parsedData.education.forEach(edu => {
      if (edu.institution) parts.push(edu.institution);
      if (edu.degree) parts.push(edu.degree);
      if (edu.field) parts.push(edu.field);
    });
  }
  
  // Languages
  if (parsedData.languages) {
    parsedData.languages.forEach(lang => {
      if (lang.language) parts.push(lang.language);
    });
  }
  
  // Additional info
  if (parsedData.additional.certifications) {
    parts.push(parsedData.additional.certifications.join(' '));
  }
  if (parsedData.additional.projects) {
    parts.push(parsedData.additional.projects.join(' '));
  }
  if (parsedData.additional.publications) {
    parts.push(parsedData.additional.publications.join(' '));
  }
  
  return parts.join(' ').trim();
}

/**
 * Create summary text from parsed resume data
 */
function createSummaryText(parsedData: ParsedResume): string {
  const parts = [];
  
  // Basic info
  if (parsedData.personal.fullName) parts.push(parsedData.personal.fullName);
  if (parsedData.personal.location) parts.push(parsedData.personal.location);
  
  // Professional summary
  if (parsedData.professional.title) parts.push(parsedData.professional.title);
  if (parsedData.professional.summary) parts.push(parsedData.professional.summary);
  
  // Key skills
  if (parsedData.professional.skills.hard) {
    parts.push(parsedData.professional.skills.hard.slice(0, 10).join(' '));
  }
  
  // Current position
  if (parsedData.experience && parsedData.experience[0]) {
    const currentExp = parsedData.experience[0];
    if (currentExp.position) parts.push(currentExp.position);
    if (currentExp.company) parts.push(currentExp.company);
  }
  
  return parts.join(' ').trim();
}

/**
 * Generate hash-based vector as fallback
 */
function generateHashBasedVector(parsedData: ParsedResume): number[] {
  const text = createSearchableText(parsedData);
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate 1536-dimensional vector based on hash
  const vector = new Array(1536).fill(0);
  for (let i = 0; i < 1536; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  
  return vector;
}

/**
 * Convert embedding to vector format for database storage
 */
export function embeddingToVector(embedding: number[]): number[] {
  return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}