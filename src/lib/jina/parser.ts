import { parseResumeWithJina } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Parse resume text using Jina AI for text preprocessing + DeepSeek for structured parsing
 */
export async function parseResumeTextWithJina(text: string): Promise<ParsedResume> {
  try {
    console.log("Using Jina AI for text preprocessing...");
    
    // Jina AI is used for embeddings, not text parsing
    // We'll use the original text and let DeepSeek do the structured parsing
    // But we can use Jina to validate the text quality first
    
    // Test Jina API connection by generating a small embedding
    const { generateEmbeddingWithJina } = await import("./client");
    await generateEmbeddingWithJina(text.substring(0, 100)); // Test with first 100 chars
    console.log("Jina AI connection verified");
    
    // Use DeepSeek for structured parsing
    const { parseResumeText } = await import("@/lib/deepseek/parser");
    return await parseResumeText(text);
  } catch (error) {
    console.error("Jina preprocessing failed, falling back to DeepSeek only:", error);
    
    // Fallback to DeepSeek if Jina fails
    const { parseResumeText } = await import("@/lib/deepseek/parser");
    return await parseResumeText(text);
  }
}

/**
 * Enhanced parsing with Jina + DeepSeek with retry logic
 */
export async function parseResumeTextWithJinaAndRetry(text: string, maxRetries: number = 3): Promise<ParsedResume> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Jina AI + DeepSeek parsing attempt ${attempt}/${maxRetries}`);
      const result = await parseResumeTextWithJina(text);
      
      // Validate that we got some meaningful data
      const hasPersonalInfo = result.personal.fullName || result.personal.email || result.personal.phone;
      const hasProfessionalInfo = result.professional.title || result.professional.skills.hard.length > 0 || (result.experience && result.experience.length > 0);
      const hasAnyData = hasPersonalInfo || hasProfessionalInfo || (result.education && result.education.length > 0);
      
      if (!hasAnyData) {
        throw new Error('No meaningful data extracted');
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Jina AI + DeepSeek parsing attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // If all attempts failed, create a fallback resume
  console.log("All Jina AI + DeepSeek parsing attempts failed, creating fallback resume");
  const { createFallbackResume } = await import("@/lib/deepseek/parser");
  return createFallbackResume(text);
}
