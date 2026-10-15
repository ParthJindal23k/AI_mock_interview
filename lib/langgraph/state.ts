import { Annotation } from "@langchain/langgraph";

export type Difficulty = "easy" | "medium" | "hard";

export type InterviewAction = "start" | "answer" | "end";

export type CurrentQuestion = {
  id: number;
  question: string;
  expectedAnswer: string;
  topic: string;
};

export type Evaluation = {
  score: number;
  strengths: string;
  weaknesses: string;
};

export type Feedback = {
  feedback: string;
  areasOfImprovement: string;
};

export type Summary = {
  overallRating: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
};

/**
 * LangGraph state schema for one interview session.
 *
 * Every channel uses last-value semantics: a node's returned partial update
 * replaces the previous value. Between requests (while waiting for the user
 * to answer) the full state is persisted in InterviewSession.sessionState.
 */
export const InterviewStateAnnotation = Annotation.Root({
  // Which entry branch the graph should take for this invocation.
  action: Annotation<InterviewAction>,

  // Session context (set once at creation)
  sessionId: Annotation<string>,
  jobPosition: Annotation<string>,
  jobDesc: Annotation<string>,
  jobExperience: Annotation<string>,
  maxQuestions: Annotation<number>,

  // Adaptive state (evolves each turn)
  currentDifficulty: Annotation<Difficulty>,
  questionsAsked: Annotation<number>,
  recentScores: Annotation<number[]>,
  previousTopics: Annotation<string[]>,

  // Current turn
  currentQuestion: Annotation<CurrentQuestion | null>,
  currentUserAnswer: Annotation<string | null>,

  // Node outputs
  evaluation: Annotation<Evaluation | null>,
  feedback: Annotation<Feedback | null>,
  ragContext: Annotation<string | null>,
  summary: Annotation<Summary | null>,

  // Control flow
  shouldEnd: Annotation<boolean>,
});

export type InterviewState = typeof InterviewStateAnnotation.State;

export function createInitialState(params: {
  sessionId: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  maxQuestions: number;
}): InterviewState {
  return {
    action: "start",
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
