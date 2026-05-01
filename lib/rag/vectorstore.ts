/**
 * RAG Vector Store module.
 *
 * Stores and retrieves interview answer embeddings from Pinecone.
 * Requires ENABLE_RAG=true, PINECONE_API_KEY, PINECONE_INDEX, and
 * a working GEMINI_API_KEY (for embeddings) to be active.
 *
 * When disabled, all operations return defaults instantly.
 */

function isRagEnabled(): boolean {
  return (
    process.env.ENABLE_RAG === "true" &&
    !!process.env.PINECONE_API_KEY &&
    !!process.env.PINECONE_INDEX
  );
}

/**
 * Store an answer embedding in Pinecone.
 * No-op when RAG is disabled.
 */
export async function storeAnswerEmbedding(
  text: string,
  metadata: {
    sessionId: string;
    questionId: number;
    difficulty: string;
    jobPosition: string;
    type: "expected" | "user";
  }
): Promise<string> {
  if (!isRagEnabled()) return "";

  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");
    const { PineconeStore } = await import("@langchain/pinecone");

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX!);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const store = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: "interview-answers",
    });

    const ids = await store.addDocuments([{ pageContent: text, metadata }]);
    return ids[0];
  } catch (error) {
    console.error("RAG store failed (non-fatal):", error);
    return "";
  }
}

/**
 * Retrieve similar answers from Pinecone for context-aware evaluation.
 * Returns instant fallback when RAG is disabled.
 */
export async function retrieveSimilarAnswers(
  query: string,
  filter: { jobPosition: string },
  k: number = 3
): Promise<string> {
  if (!isRagEnabled()) {
    return "No reference answers available.";
  }

  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");
    const { PineconeStore } = await import("@langchain/pinecone");

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX!);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const store = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: "interview-answers",
    });

    const results = await store.similaritySearch(query, k, {
      jobPosition: filter.jobPosition,
    });

    if (!results.length) {
      return "No similar answers found in the knowledge base yet.";
    }

    return results
      .map(
        (doc, i) =>
          `Reference Answer ${i + 1} (${doc.metadata.difficulty || "unknown"} level): ${doc.pageContent}`
      )
      .join("\n\n");
  } catch (error) {
    console.error("RAG retrieval error (non-fatal):", error);
    return "Knowledge base retrieval unavailable.";
  }
}
