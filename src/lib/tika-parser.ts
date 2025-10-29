import { TikaHttpClient } from 'tika-client';

const tikaClient = new TikaHttpClient({
  host: 'localhost',
  port: 9998
});

export interface TikaExtractionResult {
  text: string;
  metadata: Record<string, any>;
  success: boolean;
  error?: string;
}

/**
 * Извлекает текст из файла с помощью Apache Tika
 */
export async function extractTextWithTika(buffer: Buffer, mimeType?: string): Promise<TikaExtractionResult> {
  try {
    console.log('Starting Tika text extraction...');
    
    // Извлекаем текст и метаданные
    const result = await tikaClient.extractFromBuffer(buffer, {
      mimeType: mimeType || 'application/octet-stream'
    });
    
    console.log('Tika extraction successful');
    
    return {
      text: result.text || '',
      metadata: result.metadata || {},
      success: true
    };
    
  } catch (error) {
    console.error('Tika extraction failed:', error);
    
    return {
      text: '',
      metadata: {},
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Проверяет, доступен ли Tika сервер
 */
export async function isTikaAvailable(): Promise<boolean> {
  try {
    // Простая проверка доступности сервера
    const testBuffer = Buffer.from('test');
    await tikaClient.extractFromBuffer(testBuffer);
    return true;
  } catch (error) {
    console.log('Tika server not available:', error);
    return false;
  }
}

/**
 * Останавливает Tika сервер (если нужно)
 */
export async function stopTika(): Promise<void> {
  // TikaHttpClient не требует явной остановки
  console.log('Tika client cleanup completed');
}
