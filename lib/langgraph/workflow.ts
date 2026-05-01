import { InterviewState, createInitialState } from "./state";
import {
  generateQuestion,
  evaluateAnswer,
  generateFeedback,
  adjustDifficulty,
  generateSummary,
} from "./nodes";

/**
 * LangGraph Interview Workflow — Human-in-the-Loop
 *
 * Flow:
 *   START → generateQuestion → [PAUSE: user answers]
 *     → evaluateAnswer → generateFeedback → adjustDifficulty
 *     → shouldEnd? → generateSummary | generateQuestion → [PAUSE again]
 */

// ── Phase 1: Generate First Question ────────────────────────
export async function runGenerateQuestion(state: InterviewState): Promise<InterviewState> {
  const updates = await generateQuestion(state);
  return { ...state, ...updates };
}

// ── Phase 2: Process Answer + Continue ──────────────────────
// Returns both the evaluation/feedback AND the next question (or summary).
// The evaluation/feedback are captured BEFORE generateQuestion clears them.
export async function runProcessAnswer(state: InterviewState): Promise<{
  finalState: InterviewState;
  capturedEvaluation: InterviewState["evaluation"];
  capturedFeedback: InterviewState["feedback"];
}> {
  // Step 1: Evaluate the answer (includes RAG retrieval)
  let currentState = { ...state };
  const evalUpdates = await evaluateAnswer(currentState);
  currentState = { ...currentState, ...evalUpdates };

  // Step 2: Generate feedback
  const feedbackUpdates = await generateFeedback(currentState);
  currentState = { ...currentState, ...feedbackUpdates };

  // ★ Capture evaluation & feedback BEFORE generateQuestion clears them
  const capturedEvaluation = currentState.evaluation;
  const capturedFeedback = currentState.feedback;

  // Step 3: Adjust difficulty + check if interview should end
  const difficultyUpdates = await adjustDifficulty(currentState);
  currentState = { ...currentState, ...difficultyUpdates };

  // Step 4: Conditional — generate next question or summary
  if (currentState.shouldEnd) {
    const summaryUpdates = await generateSummary(currentState);
    currentState = { ...currentState, ...summaryUpdates };
  } else {
    const questionUpdates = await generateQuestion(currentState);
    currentState = { ...currentState, ...questionUpdates };
  }

  return {
    finalState: currentState,
    capturedEvaluation,
    capturedFeedback,
  };
}

// ── Phase 3: Force End Interview ────────────────────────────
export async function runEndInterview(state: InterviewState): Promise<InterviewState> {
  const summaryUpdates = await generateSummary(state);
  return { ...state, ...summaryUpdates, shouldEnd: true };
}

export { createInitialState } from "./state";
export type { InterviewState } from "./state";
