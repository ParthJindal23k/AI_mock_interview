import { pgTable, serial, text, varchar, integer, timestamp, jsonb, vector, index } from "drizzle-orm/pg-core";

export const EMBEDDING_DIMENSIONS = 768;

/**
 * InterviewSession — One record per interview session.
 * Tracks the overall session state, adaptive difficulty, and final summary.
 */
export const InterviewSession = pgTable("interview_session", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 }).notNull().unique(),
  jobPosition: varchar("job_position", { length: 255 }).notNull(),
  jobDesc: text("job_desc").notNull(),
  jobExperience: varchar("job_experience", { length: 10 }).notNull(),
  currentDifficulty: varchar("current_difficulty", { length: 10 }).notNull().default("medium"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  maxQuestions: integer("max_questions").notNull().default(5),
  questionsAsked: integer("questions_asked").notNull().default(0),
  sessionState: jsonb("session_state").$type<Record<string, unknown>>(),
  overallRating: varchar("overall_rating", { length: 20 }),
  summary: text("summary"),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

/**
 * InterviewQuestion — One record per question generated during a session.
 * Questions are generated dynamically (one at a time) based on adaptive difficulty.
 */
export const InterviewQuestion = pgTable("interview_question", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  expectedAnswer: text("expected_answer").notNull(),
  difficulty: varchar("difficulty", { length: 10 }).notNull(),
  topicsCovered: text("topics_covered"),
  embeddingId: varchar("embedding_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * InterviewAnswer — One record per user answer + AI evaluation.
 * Stores the user's answer, the AI score, evaluation, feedback, and RAG context.
 */
export const InterviewAnswer = pgTable("interview_answer", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  userAnswer: text("user_answer").notNull(),
  score: integer("score").notNull(),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  feedback: text("feedback").notNull(),
  areasOfImprovement: text("areas_of_improvement"),
  retrievedContext: text("retrieved_context"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * AnswerEmbedding — RAG knowledge base stored in Postgres via pgvector.
 * Each row is a reference answer (AI-generated expected answer, or a user
 * answer that scored 8+), keyed by the embedding of the question it answers.
 * Requires `CREATE EXTENSION vector` (run `npm run db:setup`).
 */
export const AnswerEmbedding = pgTable(
  "answer_embedding",
  {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    questionId: integer("question_id").notNull(),
    source: varchar("source", { length: 10 }).notNull(),
    jobPosition: varchar("job_position", { length: 255 }).notNull(),
    difficulty: varchar("difficulty", { length: 10 }).notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("answer_embedding_hnsw_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ]
);
