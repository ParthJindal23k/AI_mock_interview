import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_DIMENSIONS } from "@/utils/schema";

const EMBEDDING_MODEL = "gemini-embedding-001";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

/**
 * Embeds text into a vector of EMBEDDING_DIMENSIONS floats.
 * Questions are compared with questions, so SEMANTIC_SIMILARITY is the right task type.
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType: "SEMANTIC_SIMILARITY",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Unexpected embedding size: ${values?.length ?? 0}`);
  }
  return values;
}
