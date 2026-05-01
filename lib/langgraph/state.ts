/**
 * InterviewState — the state object that flows through the LangGraph workflow.
 *
 * This is serialized to the database (InterviewSession.sessionState) between
 * human-in-the-loop turns, allowing the graph to pause after question generation
 * and resume from answer evaluation when the user submits their response.
 */
export interface InterviewState {
  // ── Session Context (set once at creation) ──
  sessionId: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  maxQuestions: number;

  // ── Adaptive State (evolves each turn) ──
  currentDifficulty: "easy" | "medium" | "hard";
  questionsAsked: number;
  recentScores: number[];
  previousTopics: string[];

  // ── Current Turn Data ──
  currentQuestion: {
    id: number;
    question: string;
    expectedAnswer: string;
    topic: string;
  } | null;
  currentUserAnswer: string | null;

  // ── Outputs (populated by nodes) ──
  evaluation: {
    score: number;
    strengths: string;
    weaknesses: string;
  } | null;
  feedback: {
    feedback: string;
    areasOfImprovement: string;
  } | null;
  ragContext: string | null;
  summary: {
    overallRating: string;
    strengths: string;
    weaknesses: string;
    recommendations: string;
  } | null;

  // ── Control Flow ──
  shouldEnd: boolean;
}

/**
 * Creates a fresh initial state for a new interview session.
 */
export function createInitialState(params: {
  sessionId: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  maxQuestions: number;
}): InterviewState {
  return {
    sessionId: params.sessionId,
    jobPosition: params.jobPosition,
    jobDesc: params.jobDesc,
    jobExperience: params.jobExperience,
    maxQuestions: params.maxQuestions,
    currentDifficulty: "medium",
    questionsAsked: 0,
    recentScores: [],
    previousTopics: [],
    currentQuestion: null,
    currentUserAnswer: null,
    evaluation: null,
    feedback: null,
    ragContext: null,
    summary: null,
    shouldEnd: false,
  };
}
