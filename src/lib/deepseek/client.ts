import OpenAI from "openai";

/**
 * DeepSeek API client using OpenAI SDK
 * DeepSeek API is compatible with OpenAI's API format
 */
export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
});

/**
 * Generate chat completion with DeepSeek
 */
export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
) {
  const response = await deepseek.chat.completions.create({
    model: options?.model || "deepseek-chat",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
    response_format: options?.jsonMode ? { type: "json_object" } : undefined,
  });

  return response;
}

/**
 * Generate embeddings with DeepSeek
 */
export async function createEmbedding(text: string | string[]) {
  const response = await deepseek.embeddings.create({
    model: "deepseek-embed",
    input: text,
  });

  return response;
}

/**
 * Stream chat completion with DeepSeek
 */
export async function createStreamingChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const stream = await deepseek.chat.completions.create({
    model: options?.model || "deepseek-chat",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
    stream: true,
  });

  return stream;
}

