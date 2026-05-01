/**
 * Embedding stub.
 *
 * The RAG pipeline's embedding + retrieval calls in nodes.ts are already
 * wrapped in try/catch blocks with graceful fallbacks. When Pinecone is
 * not configured or embeddings fail, the interview continues without
 * RAG context — the LLM evaluates using just the expected answer.
 *
 * To enable full RAG:
 * 1. Set PINECONE_API_KEY and PINECONE_INDEX in .env
 * 2. Ensure your embedding model API has quota
 * 3. The system will automatically start storing and retrieving embeddings
 */

// Placeholder - embeddings will be generated via the vectorstore module
// when Pinecone is properly configured
export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;
