import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// ── Question Generation Parser ──────────────────────────────
export const questionSchema = z.object({
  question: z.string().describe("A technical interview question appropriate for the given difficulty level"),
  expectedAnswer: z.string().describe("A comprehensive model answer that would score 9-10/10"),
  topic: z.string().describe("The specific technical topic this question covers (e.g., 'React Hooks', 'SQL Joins')"),
});

export const questionParser = StructuredOutputParser.fromZodSchema(questionSchema);

export type QuestionOutput = z.infer<typeof questionSchema>;

// ── Answer Evaluation Parser ────────────────────────────────
export const evaluationSchema = z.object({
  score: z.number().min(1).max(10).describe("Score from 1 (poor) to 10 (excellent)"),
  strengths: z.string().describe("What the candidate demonstrated well in their answer"),
  weaknesses: z.string().describe("Where the candidate's answer fell short or was incomplete"),
});

export const evaluationParser = StructuredOutputParser.fromZodSchema(evaluationSchema);

export type EvaluationOutput = z.infer<typeof evaluationSchema>;

// ── Feedback Generation Parser ──────────────────────────────
export const feedbackSchema = z.object({
  feedback: z.string().describe("3-5 lines of actionable, specific feedback for improvement"),
  areasOfImprovement: z.string().describe("Comma-separated list of specific topics/concepts the candidate should study"),
});

export const feedbackParser = StructuredOutputParser.fromZodSchema(feedbackSchema);

export type FeedbackOutput = z.infer<typeof feedbackSchema>;

// ── Interview Summary Parser ────────────────────────────────
export const summarySchema = z.object({
  overallRating: z.string().describe("Overall rating in format like '7.5/10'"),
  strengths: z.string().describe("Top 3 strengths demonstrated across all answers"),
  weaknesses: z.string().describe("Top 3 consistent weak areas identified"),
  recommendations: z.string().describe("Specific study plan recommendations for the candidate"),
});

export const summaryParser = StructuredOutputParser.fromZodSchema(summarySchema);

export type SummaryOutput = z.infer<typeof summarySchema>;
