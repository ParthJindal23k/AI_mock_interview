import { pgTable, serial, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// ── Legacy Tables (kept for backward compatibility) ─────────
export const MockInterview = pgTable("mockInterview", {
  id: serial("id").primaryKey(),
  mockId: varchar("mockId").notNull(),
  jsonMockResp: text("jsonMockResp").notNull(),
  jobPosition: varchar("jobPosition").notNull(),
  jobDesc: varchar("jobDesc").notNull(),
  jobExperience: varchar("jobExperience").notNull(),
  createdBy: varchar("createdBy").notNull(),
  createdAt: varchar("createdAt").notNull(),
});

export const UserAnswer = pgTable("userAnswer", {
  id: serial("id").primaryKey(),
  mockIdRef: varchar("mockId").notNull(),
  question: varchar("question").notNull(),
  correctAns: text("correctAns"),
  userAns: text("userAns"),
  feedback: text("feedback"),
  rating: varchar("rating"),
  userEmail: varchar("userEmail"),
  createdAt: varchar("createdAt"),
});

// ── New Tables: Normalized Adaptive Interview Design ────────

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
