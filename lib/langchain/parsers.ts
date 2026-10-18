// Shapes of the JSON objects each prompt in chains.ts asks the LLM to return.

export type QuestionOutput = {
  question: string;
  expectedAnswer: string;
  topic: string;
};

export type EvaluationOutput = {
  score: number;
  strengths: string;
  weaknesses: string;
};

export type FeedbackOutput = {
  feedback: string;
  areasOfImprovement: string;
};

export type SummaryOutput = {
  overallRating: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
};
