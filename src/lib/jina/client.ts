/**
 * Jina AI API client for resume parsing and embeddings
 */

const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_BASE_URL = 'https://api.jina.ai';

export interface JinaParseRequest {
  text: string;
  model?: string;
}

export interface JinaParseResponse {
  results: Array<{
    text: string;
    score: number;
    index: number;
  }>;
}

export interface JinaEmbeddingRequest {
  input: string[];
  model?: string;
}

export interface JinaEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Parse resume text using Jina AI
 */
export async function parseResumeWithJina(text: string): Promise<string> {
  if (!JINA_API_KEY) {
    throw new Error('JINA_API_KEY is not configured');
  }

  const response = await fetch(`${JINA_BASE_URL}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JINA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [text],
      model: 'jina-embeddings-v2-base-en'
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
  }

  const data: JinaEmbeddingResponse = await response.json();
  
  // Return the original text (Jina doesn't parse, just generates embeddings)
  return text;
}

/**
 * Generate embeddings using Jina AI
 */
export async function generateEmbeddingWithJina(text: string): Promise<number[]> {
  if (!JINA_API_KEY) {
    throw new Error('JINA_API_KEY is not configured');
  }

  const response = await fetch(`${JINA_BASE_URL}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JINA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [text],
      model: 'jina-embeddings-v2-base-en'
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
  }

  const data: JinaEmbeddingResponse = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data received from Jina API');
  }

  return data.data[0].embedding;
}

/**
 * Generate multiple embeddings using Jina AI
 */
export async function generateEmbeddingsWithJina(texts: string[]): Promise<number[][]> {
  if (!JINA_API_KEY) {
    throw new Error('JINA_API_KEY is not configured');
  }

  const response = await fetch(`${JINA_BASE_URL}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JINA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: 'jina-embeddings-v2-base-en'
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
  }

  const data: JinaEmbeddingResponse = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data received from Jina API');
  }

  // Sort by index to maintain order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}
