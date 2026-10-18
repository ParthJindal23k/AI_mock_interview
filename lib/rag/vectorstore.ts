/**
 * RAG vector store backed by pgvector in the main Postgres database.
 *
 * Each reference answer is stored next to the embedding of the question it
 * answers. When evaluating a new answer we embed the current question, find
 * the most similar past questions (cosine similarity, HNSW index), and pass
 * their high-quality answers to the evaluator as extra grading context.
 *
 * Active when GEMINI_API_KEY is set (used for embeddings), unless ENABLE_RAG=false.
 * All failures are non-fatal: evaluation falls back to the expected answer only.
 */
import { and, eq, lt, ne, sql, cosineDistance } from "drizzle-orm";
import { db } from "@/utils/db";
import { AnswerEmbedding } from "@/utils/schema";
import { embedText } from "./embeddings";

const MIN_SIMILARITY = 0.75;

function isRagEnabled(): boolean {
  return process.env.ENABLE_RAG !== "false" && !!process.env.GEMINI_API_KEY;
}

export async function embedQuestion(question: string): Promise<number[] | null> {
  if (!isRagEnabled()) return null;
  try {
    return await embedText(question);
  } catch (error) {
    console.error("Embedding failed (non-fatal):", error);
    return null;
  }
}

/**
 * Reuses the embedding stored when the question was generated; embeds again only if it is missing.
 */
export async function getQuestionEmbedding(questionId: number, question: string): Promise<number[] | null> {
  if (!isRagEnabled()) return null;
  try {
    const [row] = await db
      .select({ embedding: AnswerEmbedding.embedding })
      .from(AnswerEmbedding)
      .where(and(eq(AnswerEmbedding.questionId, questionId), eq(AnswerEmbedding.source, "expected")))
      .limit(1);
    if (row) return row.embedding;
  } catch (error) {
    console.error("Embedding lookup failed (non-fatal):", error);
  }
  return embedQuestion(question);
}

/**
 * Stores a reference answer. Returns the new row id, or null when RAG is disabled or fails.
 */
export async function storeReferenceAnswer(params: {
  questionEmbedding: number[] | null;
  sessionId: string;
  questionId: number;
  source: "expected" | "user";
  jobPosition: string;
  difficulty: string;
  question: string;
  answer: string;
}): Promise<number | null> {
  const { questionEmbedding, ...row } = params;
  if (!questionEmbedding) return null;

  try {
    const [inserted] = await db
      .insert(AnswerEmbedding)
      .values({ ...row, embedding: questionEmbedding })
      .returning({ id: AnswerEmbedding.id });
    return inserted.id;
  } catch (error) {
    console.error("Vector store insert failed (non-fatal):", error);
    return null;
  }
}

/**
 * Finds reference answers to questions similar to the current one.
 * Excludes the current question itself, since its expected answer is already in the prompt.
 */
export async function retrieveSimilarAnswers(params: {
  questionEmbedding: number[] | null;
  excludeQuestionId: number;
  k?: number;
}): Promise<string> {
  const { questionEmbedding, excludeQuestionId, k = 3 } = params;
  if (!questionEmbedding) return "No reference answers available.";

  try {
    // ORDER BY the raw distance (not a derived expression) so Postgres can use the HNSW index.
    const distance = cosineDistance(AnswerEmbedding.embedding, questionEmbedding);

    const results = await db
      .select({
        question: AnswerEmbedding.question,
        answer: AnswerEmbedding.answer,
        difficulty: AnswerEmbedding.difficulty,
        source: AnswerEmbedding.source,
        similarity: sql<number>`1 - (${distance})`,
      })
      .from(AnswerEmbedding)
      .where(and(lt(distance, 1 - MIN_SIMILARITY), ne(AnswerEmbedding.questionId, excludeQuestionId)))
      .orderBy(distance)
      .limit(k);

    if (!results.length) {
      return "No similar questions found in the knowledge base yet.";
    }

    return results
      .map(
        (r, i) =>
          `Reference ${i + 1} (${r.difficulty}, ${r.source === "user" ? "high-scoring candidate answer" : "model answer"}, similarity ${Number(r.similarity).toFixed(2)})\nQuestion: ${r.question}\nAnswer: ${r.answer}`
      )
      .join("\n\n");
  } catch (error) {
    console.error("Vector search failed (non-fatal):", error);
    return "Knowledge base retrieval unavailable.";
  }
}
