/**
 * File parsing utilities for extracting text from PDF and DOCX files
 */

/**
 * Extract text from PDF file using PDF.js (better quality)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Try PDF.js first (better quality)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    if (fullText.trim().length > 0) {
      return fullText.trim();
    }
  } catch (error) {
    console.log("PDF.js failed, trying pdf-parse fallback:", error);
  }
  
  try {
    // Fallback to pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from DOCX file
 * Note: mammoth works in Node.js environment (API routes)
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues in client-side
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error("DOCX file appears to be empty");
    }
    
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    // Try to extract as plain text if DOCX parsing fails
    const textContent = buffer.toString("utf-8");
    if (textContent && textContent.length > 50) {
      console.log("Falling back to plain text extraction");
      return textContent;
    }
    throw new Error("Failed to extract text from DOCX. Please ensure the file is a valid DOCX format.");
  }
}

/**
 * Extract text from file based on mime type
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  // Handle application/octet-stream by trying different parsers
  if (mimeType === "application/octet-stream" && fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      return extractTextFromPDF(buffer);
    } else if (ext === 'docx' || ext === 'doc') {
      return extractTextFromDOCX(buffer);
    } else if (ext === 'txt') {
      return buffer.toString("utf-8");
    }
  }
  
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractTextFromDOCX(buffer);
  } else if (mimeType.startsWith("text/")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(size: number): boolean {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  return size <= MAX_SIZE;
}

/**
 * Validate file type (PDF, DOCX, DOC, TXT)
 */
export function validateFileType(mimeType: string, fileName?: string): boolean {
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "application/octet-stream", // Sometimes DOCX files are detected as this
  ];
  
  // Check mime type
  if (ALLOWED_TYPES.includes(mimeType)) {
    return true;
  }
  
  // Fallback to file extension check
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['pdf', 'docx', 'doc', 'txt'].includes(ext || '');
  }
  
  return false;
}

/**
 * Get file extension from mime type
 */
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
  };
  return extensions[mimeType] || "bin";
}

