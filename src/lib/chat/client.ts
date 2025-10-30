import { deepseek } from "@/lib/deepseek/client";
import { openai } from "@/lib/openai/client";
import OpenAI from "openai";

export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { model?: string; temperature?: number; maxTokens?: number; jsonMode?: boolean }
) {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_CHAT === '1') {
    const resp = await openai.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      response_format: options?.jsonMode ? { type: "json_object" } : undefined,
    });
    return resp;
  }
  // default DeepSeek
  return await deepseek.chat.completions.create({
    model: options?.model || "deepseek-chat",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
    response_format: options?.jsonMode ? { type: "json_object" } : undefined,
  });
}


