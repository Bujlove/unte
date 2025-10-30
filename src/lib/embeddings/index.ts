import { generateEmbeddingWithJina } from "@/lib/jina/embeddings";
import { openai } from "@/lib/openai/client";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_EMBEDDINGS === '1') {
    try {
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return res.data[0].embedding as unknown as number[];
    } catch (e) {
      // fallback to Jina
    }
  }
  return await generateEmbeddingWithJina(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_EMBEDDINGS === '1') {
    try {
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });
      return res.data.sort((a,b)=>a.index-b.index).map(d=> d.embedding as unknown as number[]);
    } catch (e) {
      // fallback
    }
  }
  // Fallback to Jina batch
  const { generateEmbeddingsWithJina } = await import("@/lib/jina/client");
  return await generateEmbeddingsWithJina(texts);
}


