import { parseResumeWithJina } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Parse resume text using Jina AI for better text extraction
 */
export async function parseResumeTextWithJina(text: string): Promise<ParsedResume> {
  try {
    // First, use Jina to parse and clean the text
    const cleanedText = await parseResumeWithJina(text);
    
    // Then use DeepSeek for structured parsing
    const { parseResumeText } = await import("@/lib/deepseek/parser");
    return await parseResumeText(cleanedText);
  } catch (error) {
    console.error("Jina parsing failed, falling back to DeepSeek:", error);
    
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
      console.log(`Jina parsing attempt ${attempt}/${maxRetries}`);
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
      console.error(`Jina parsing attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // If all attempts failed, create a fallback resume
  console.log("All Jina parsing attempts failed, creating fallback resume");
  const { createFallbackResume } = await import("@/lib/deepseek/parser");
  return createFallbackResume(text);
}
