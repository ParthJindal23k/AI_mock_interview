import { model } from "./model";
import type {
  QuestionOutput,
  EvaluationOutput,
  FeedbackOutput,
  SummaryOutput,
} from "./parsers";

/**
 * Robust JSON extraction from LLM output.
 * Handles markdown fences, extra text, and various formatting quirks.
 */
function extractJSON(text: string): any {
  // Try to find JSON in the response
  let cleaned = text.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

  // Try parsing the whole thing first
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Try to find a JSON object in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  throw new Error(`Could not extract JSON from LLM response: ${text.substring(0, 200)}`);
}

/**
 * Invoke the model with a prompt and parse the JSON response.
 */
async function runChain<T>(prompt: string, input: Record<string, string>): Promise<T> {
  // Replace template variables
  let formatted = prompt;
  for (const [key, value] of Object.entries(input)) {
    formatted = formatted.replaceAll(`{${key}}`, value);
  }

  const response = await model.invoke(formatted);
  const text = typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);

  console.log("[LangChain] Raw LLM response:", text.substring(0, 300));

  return extractJSON(text) as T;
}

// ── Question Generation ─────────────────────────────────────
const QUESTION_PROMPT = `You are a professional technical interviewer conducting a mock interview.

Job Position: {jobPosition}
Tech Stack / Job Description: {jobDesc}
Candidate Experience: {jobExperience} years
Current Difficulty Level: {difficulty}

Generate exactly ONE interview question at the specified difficulty level.
- easy: fundamental concepts, definitions, basic usage
- medium: practical scenarios, comparisons, implementation details
- hard: system design, edge cases, deep internals, optimization

Topics already covered (DO NOT repeat): {previousTopics}

Respond ONLY with a JSON object in this exact format, no other text:
{
  "question": "Your interview question here",
  "expectedAnswer": "A comprehensive model answer",
  "topic": "The specific technical topic covered"
}`;

export async function generateQuestionChain(input: {
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  difficulty: string;
  previousTopics: string;
}): Promise<QuestionOutput> {
  return runChain<QuestionOutput>(QUESTION_PROMPT, input);
}

// ── Answer Evaluation ───────────────────────────────────────
const EVALUATION_PROMPT = `You are evaluating a candidate's answer in a technical interview.

Question: {question}
Expected Answer: {expectedAnswer}
Candidate's Answer: {userAnswer}

Similar high-quality answers from past interviews for reference:
{ragContext}

Evaluate the candidate's answer thoroughly.

Respond ONLY with a JSON object in this exact format, no other text:
{
  "score": 7,
  "strengths": "What the candidate did well",
  "weaknesses": "Where the answer fell short"
}

The score MUST be a number from 1 to 10 (not a string).`;

export async function evaluateAnswerChain(input: {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  ragContext: string;
}): Promise<EvaluationOutput> {
  const result = await runChain<any>(EVALUATION_PROMPT, input);
  // Ensure score is a number
  return {
    score: Number(result.score) || 5,
    strengths: String(result.strengths || ""),
    weaknesses: String(result.weaknesses || ""),
  };
}

// ── Feedback Generation ─────────────────────────────────────
const FEEDBACK_PROMPT = `Based on the following interview evaluation, provide actionable feedback.

Question: {question}
Candidate's Answer: {userAnswer}
Score: {score}/10
Strengths: {strengths}
Weaknesses: {weaknesses}

Respond ONLY with a JSON object in this exact format, no other text:
{
  "feedback": "3-5 lines of specific, actionable improvement advice",
  "areasOfImprovement": "Topic1, Topic2, Topic3"
}`;

export async function generateFeedbackChain(input: {
  question: string;
  userAnswer: string;
  score: string;
  strengths: string;
  weaknesses: string;
}): Promise<FeedbackOutput> {
  return runChain<FeedbackOutput>(FEEDBACK_PROMPT, input);
}

// ── Interview Summary ───────────────────────────────────────
const SUMMARY_PROMPT = `You are summarizing a complete mock interview performance.

Job Position: {jobPosition}
Candidate Experience: {jobExperience} years

Complete interview transcript with scores:
{questionsAndScores}

Respond ONLY with a JSON object in this exact format, no other text:
{
  "overallRating": "7.5/10",
  "strengths": "Top 3 strengths across all answers",
  "weaknesses": "Top 3 consistent weak areas",
  "recommendations": "Specific study plan recommendations"
}`;

export async function generateSummaryChain(input: {
  jobPosition: string;
  jobExperience: string;
  questionsAndScores: string;
}): Promise<SummaryOutput> {
  return runChain<SummaryOutput>(SUMMARY_PROMPT, input);
}
