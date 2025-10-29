/**
 * File parsing utilities for extracting text from PDF and DOCX files
 * Now with Apache Tika integration for robust text extraction
 */

// import { extractTextWithTika, isTikaAvailable } from "../tika-parser";

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
    const data = await pdfParse(Buffer.from(buffer));
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from DOC file (old Word format)
 * Note: DOC files are more complex than DOCX, we'll try plain text extraction
 */
export async function extractTextFromDOC(buffer: Buffer): Promise<string> {
  try {
    console.log("Attempting to extract text from DOC file...");
    
    // DOC files are binary and harder to parse than DOCX
    // Try to extract readable text from the binary data
    const textContent = buffer.toString("utf-8");
    
    // Look for readable text patterns in the binary data
    const readableText = textContent
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (readableText && readableText.length > 50) {
      console.log(`DOC text extraction successful, length: ${readableText.length}`);
      return readableText;
    }
    
    throw new Error("Could not extract readable text from DOC file");
  } catch (error) {
    console.error("Error parsing DOC:", error);
    throw new Error("Failed to extract text from DOC file. Please try converting to DOCX or PDF format.");
  }
}

/**
 * Extract text from DOCX file
 * Note: mammoth works in Node.js environment (API routes)
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Check if file is actually a valid DOCX (ZIP) file
    const isZipFile = buffer[0] === 0x50 && buffer[1] === 0x4B; // ZIP signature
    if (!isZipFile) {
      console.log("File doesn't appear to be a valid DOCX/ZIP file, trying plain text extraction");
      const textContent = buffer.toString("utf-8");
      if (textContent && textContent.length > 50) {
        return textContent;
      }
      throw new Error("File is not a valid DOCX format");
    }

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
 * Enhanced with Apache Tika integration for robust text extraction
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  console.log(`Extracting text from file: ${fileName}, mimeType: ${mimeType}, size: ${buffer.length}`);
  
  // Tika temporarily disabled - using specific parsers
  console.log('Using specific parsers for text extraction...');
  
  // Fallback to specific parsers based on file type
  console.log('Using specific parsers as fallback...');
  
  // Helper function to get file extension
  const getExtension = (fileName?: string): string => {
    if (!fileName) return '';
    return fileName.toLowerCase().split('.').pop() || '';
  };
  
  // Handle generic binary types by trying different parsers based on file extension
  const genericTypes = [
    "application/octet-stream",
    "application/binary", 
    "application/x-binary"
  ];
  
  if (genericTypes.includes(mimeType) && fileName) {
    const ext = getExtension(fileName);
    console.log(`Generic binary type detected, file extension: ${ext}`);
    
    if (ext === 'pdf') {
      return extractTextFromPDF(buffer);
    } else if (ext === 'docx') {
      return extractTextFromDOCX(buffer);
    } else if (ext === 'doc') {
      return extractTextFromDOC(buffer);
    } else if (ext === 'txt' || ext === 'rtf') {
      return buffer.toString("utf-8");
    }
  }
  
  // Handle PDF types
  if (mimeType === "application/pdf" || 
      mimeType === "application/x-pdf" || 
      mimeType === "application/acrobat" || 
      mimeType === "text/pdf") {
    return extractTextFromPDF(buffer);
  }
  
  // Handle DOCX types
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.template" ||
      (mimeType === "application/zip" && getExtension(fileName) === 'docx')) {
    return extractTextFromDOCX(buffer);
  }
  
  // Handle DOC types
  if (mimeType === "application/msword" || 
      mimeType === "application/vnd.ms-word" || 
      mimeType === "application/x-msword") {
    return extractTextFromDOC(buffer);
  }
  
  // Handle text types
  if (mimeType.startsWith("text/") || mimeType === "application/rtf") {
    return buffer.toString("utf-8");
  }
  
  // Fallback: try to determine by file extension if MIME type is unknown
  if (fileName) {
    const ext = getExtension(fileName);
    console.log(`Unknown MIME type ${mimeType}, trying by extension: ${ext}`);
    
    if (ext === 'pdf') {
      return extractTextFromPDF(buffer);
    } else if (ext === 'docx') {
      return extractTextFromDOCX(buffer);
    } else if (ext === 'doc') {
      return extractTextFromDOC(buffer);
    } else if (ext === 'txt' || ext === 'rtf') {
      return buffer.toString("utf-8");
    }
  }
  
  // Last resort: try plain text extraction
  console.log(`Unknown file type ${mimeType}, trying plain text extraction`);
  const textContent = buffer.toString("utf-8");
  if (textContent && textContent.length > 50) {
    console.log(`Plain text extraction successful, length: ${textContent.length}`);
    return textContent;
  }
  
  throw new Error(`Unsupported file type: ${mimeType}. Supported formats: PDF, DOCX, DOC, TXT`);
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
 * More flexible validation that accepts multiple MIME types and extensions
 */
export function validateFileType(mimeType: string, fileName?: string): boolean {
  // Extended list of allowed MIME types
  const ALLOWED_TYPES = [
    // PDF types
    "application/pdf",
    "application/x-pdf",
    "application/acrobat",
    "text/pdf",
    
    // DOCX types
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "application/zip", // Sometimes DOCX is detected as ZIP
    
    // DOC types
    "application/msword",
    "application/vnd.ms-word",
    "application/x-msword",
    
    // TXT types
    "text/plain",
    "text/txt",
    "text/rtf",
    "application/rtf",
    
    // Generic types that might contain our supported formats
    "application/octet-stream", // Sometimes files are detected as this
    "application/binary",
    "application/x-binary",
  ];
  
  // Check mime type first
  if (ALLOWED_TYPES.includes(mimeType)) {
    return true;
  }
  
  // Fallback to file extension check for better compatibility
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'docx', 'doc', 'txt', 'rtf'];
    return allowedExtensions.includes(ext || '');
  }
  
  return false;
}

/**
 * Get file extension from mime type
 * Enhanced to support multiple MIME types
 */
export function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    // PDF types
    "application/pdf": "pdf",
    "application/x-pdf": "pdf",
    "application/acrobat": "pdf",
    "text/pdf": "pdf",
    
    // DOCX types
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": "docx",
    "application/zip": "docx", // When DOCX is detected as ZIP
    
    // DOC types
    "application/msword": "doc",
    "application/vnd.ms-word": "doc",
    "application/x-msword": "doc",
    
    // Text types
    "text/plain": "txt",
    "text/txt": "txt",
    "text/rtf": "rtf",
    "application/rtf": "rtf",
  };
  return extensions[mimeType] || "bin";
}

