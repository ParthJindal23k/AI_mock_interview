import { StateGraph, START, END } from "@langchain/langgraph";
import { InterviewStateAnnotation, type InterviewState } from "./state";
import {
  generateQuestion,
  evaluateAnswer,
  generateFeedback,
  adjustDifficulty,
  generateSummary,
} from "./nodes";

/**
 * Interview workflow as a LangGraph StateGraph (human-in-the-loop).
 *
 *            ┌─ action=start ──► generateQuestion ──► END   (pause: wait for answer)
 *   START ───┼─ action=answer ─► evaluateAnswer ─► generateFeedback ─► adjustDifficulty
 *            │                                                           │
 *            │                        shouldEnd=false ◄──────────────────┤
 *            │                        └─► generateQuestion ──► END       │
 *            │                        shouldEnd=true  ◄──────────────────┘
 *            └─ action=end ───────────► generateSummary ──► END
 *
 * The graph runs once per HTTP request. Between requests the state lives in
 * InterviewSession.sessionState, so the interview can pause for the user
 * on a serverless deployment without an in-memory checkpointer.
 */
const interviewGraph = new StateGraph(InterviewStateAnnotation)
  .addNode("generateQuestion", generateQuestion)
  .addNode("evaluateAnswer", evaluateAnswer)
  .addNode("generateFeedback", generateFeedback)
  .addNode("adjustDifficulty", adjustDifficulty)
  .addNode("generateSummary", generateSummary)
  .addConditionalEdges(
    START,
    (state) => {
      if (state.action === "answer") return "evaluateAnswer";
      if (state.action === "end") return "generateSummary";
      return "generateQuestion";
    },
    ["generateQuestion", "evaluateAnswer", "generateSummary"]
  )
  .addEdge("evaluateAnswer", "generateFeedback")
  .addEdge("generateFeedback", "adjustDifficulty")
  .addConditionalEdges(
    "adjustDifficulty",
    (state) => (state.shouldEnd ? "generateSummary" : "generateQuestion"),
    ["generateQuestion", "generateSummary"]
  )
  .addEdge("generateQuestion", END)
  .addEdge("generateSummary", END)
  .compile();

export async function runGenerateQuestion(state: InterviewState): Promise<InterviewState> {
  return interviewGraph.invoke({ ...state, action: "start" });
}

export async function runProcessAnswer(state: InterviewState, userAnswer: string): Promise<InterviewState> {
  return interviewGraph.invoke({ ...state, action: "answer", currentUserAnswer: userAnswer });
}

export async function runEndInterview(state: InterviewState): Promise<InterviewState> {
  const finalState = await interviewGraph.invoke({ ...state, action: "end" });
  return { ...finalState, shouldEnd: true };
}

export { createInitialState } from "./state";
export type { InterviewState } from "./state";
