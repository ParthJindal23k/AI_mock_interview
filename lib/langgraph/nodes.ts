import type { InterviewState, Difficulty } from "./state";
import {
  generateQuestionChain,
  evaluateAnswerChain,
  generateFeedbackChain,
  generateSummaryChain,
} from "../langchain/chains";
import {
  embedQuestion,
  getQuestionEmbedding,
  storeReferenceAnswer,
  retrieveSimilarAnswers,
} from "../rag/vectorstore";
import { db } from "@/utils/db";
import { InterviewQuestion, InterviewAnswer, InterviewSession } from "@/utils/schema";
import { eq } from "drizzle-orm";

type NodeUpdate = Partial<InterviewState>;

/**
 * Node: generateQuestion
 * Generates ONE question at the current difficulty, avoiding covered topics.
 * Stores it in Postgres and adds its expected answer to the vector store.
 */
export async function generateQuestion(state: InterviewState): Promise<NodeUpdate> {
  const result = await generateQuestionChain({
    jobPosition: state.jobPosition,
    jobDesc: state.jobDesc,
    jobExperience: state.jobExperience,
    difficulty: state.currentDifficulty,
    previousTopics: state.previousTopics.length > 0
      ? state.previousTopics.join(", ")
      : "None yet",
  });

  const questionNumber = state.questionsAsked + 1;

  const [inserted] = await db.insert(InterviewQuestion).values({
    sessionId: state.sessionId,
    questionNumber,
    question: result.question,
    expectedAnswer: result.expectedAnswer,
    difficulty: state.currentDifficulty,
    topicsCovered: result.topic,
  }).returning({ id: InterviewQuestion.id });

  const embeddingRowId = await storeReferenceAnswer({
    questionEmbedding: await embedQuestion(result.question),
    sessionId: state.sessionId,
    questionId: inserted.id,
    source: "expected",
    jobPosition: state.jobPosition,
    difficulty: state.currentDifficulty,
    question: result.question,
    answer: result.expectedAnswer,
  });

  if (embeddingRowId !== null) {
    await db.update(InterviewQuestion)
      .set({ embeddingId: String(embeddingRowId) })
      .where(eq(InterviewQuestion.id, inserted.id));
  }

  return {
    currentQuestion: {
      id: inserted.id,
      question: result.question,
      expectedAnswer: result.expectedAnswer,
      topic: result.topic,
    },
    questionsAsked: questionNumber,
    previousTopics: [...state.previousTopics, result.topic],
    currentUserAnswer: null,
    ragContext: null,
  };
}

/**
 * Node: evaluateAnswer
 * RAG step: retrieves reference answers to similar past questions from pgvector,
 * then scores the user's answer against the expected answer + retrieved context.
 */
export async function evaluateAnswer(state: InterviewState): Promise<NodeUpdate> {
  if (!state.currentQuestion || !state.currentUserAnswer) {
    throw new Error("Cannot evaluate: missing question or user answer");
  }

  const questionEmbedding = await getQuestionEmbedding(
    state.currentQuestion.id,
    state.currentQuestion.question
  );

  const ragContext = await retrieveSimilarAnswers({
    questionEmbedding,
    excludeQuestionId: state.currentQuestion.id,
  });

  const evaluation = await evaluateAnswerChain({
    question: state.currentQuestion.question,
    expectedAnswer: state.currentQuestion.expectedAnswer,
    userAnswer: state.currentUserAnswer,
    ragContext,
  });

  // Strong candidate answers grow the knowledge base for future evaluations.
  if (evaluation.score >= 8) {
    await storeReferenceAnswer({
      questionEmbedding,
      sessionId: state.sessionId,
      questionId: state.currentQuestion.id,
      source: "user",
      jobPosition: state.jobPosition,
      difficulty: state.currentDifficulty,
      question: state.currentQuestion.question,
      answer: state.currentUserAnswer,
    });
  }

  return {
    evaluation,
    ragContext,
    recentScores: [...state.recentScores, evaluation.score],
  };
}

/**
 * Node: generateFeedback
 * Produces actionable feedback and stores the full answer record.
 */
export async function generateFeedback(state: InterviewState): Promise<NodeUpdate> {
  if (!state.evaluation || !state.currentQuestion || !state.currentUserAnswer) {
    throw new Error("Cannot generate feedback: missing evaluation data");
  }

  const feedback = await generateFeedbackChain({
    question: state.currentQuestion.question,
    userAnswer: state.currentUserAnswer,
    score: String(state.evaluation.score),
    strengths: state.evaluation.strengths,
    weaknesses: state.evaluation.weaknesses,
  });

  await db.insert(InterviewAnswer).values({
    questionId: state.currentQuestion.id,
    sessionId: state.sessionId,
    userAnswer: state.currentUserAnswer,
    score: state.evaluation.score,
    strengths: state.evaluation.strengths,
    weaknesses: state.evaluation.weaknesses,
    feedback: feedback.feedback,
    areasOfImprovement: feedback.areasOfImprovement,
    retrievedContext: state.ragContext,
  });

  return { feedback };
}

/**
 * Node: adjustDifficulty
 * Raises difficulty when the last two scores average 8+, lowers it at 4 or below,
 * and decides whether the interview should end.
 */
export async function adjustDifficulty(state: InterviewState): Promise<NodeUpdate> {
  let newDifficulty: Difficulty = state.currentDifficulty;
  const lastTwo = state.recentScores.slice(-2);

  if (lastTwo.length >= 2) {
    const avg = lastTwo.reduce((a, b) => a + b, 0) / lastTwo.length;

    if (avg >= 8 && newDifficulty !== "hard") {
      newDifficulty = newDifficulty === "easy" ? "medium" : "hard";
    } else if (avg <= 4 && newDifficulty !== "easy") {
      newDifficulty = newDifficulty === "hard" ? "medium" : "easy";
    }
  }

  return {
    currentDifficulty: newDifficulty,
    shouldEnd: state.questionsAsked >= state.maxQuestions,
  };
}

/**
 * Node: generateSummary
 * Summarizes the whole interview and marks the session as completed.
 */
export async function generateSummary(state: InterviewState): Promise<NodeUpdate> {
  const questions = await db.select().from(InterviewQuestion)
    .where(eq(InterviewQuestion.sessionId, state.sessionId))
    .orderBy(InterviewQuestion.questionNumber);

  const answers = await db.select().from(InterviewAnswer)
    .where(eq(InterviewAnswer.sessionId, state.sessionId));

  const answersMap = new Map(answers.map(a => [a.questionId, a]));

  const questionsAndScores = questions.map((q) => {
    const a = answersMap.get(q.id);
    return `Q${q.questionNumber} [${q.difficulty}]: ${q.question}\nScore: ${a?.score ?? "N/A"}/10\nAnswer: ${a?.userAnswer ?? "Not answered"}`;
  }).join("\n\n---\n\n");

  const generated = await generateSummaryChain({
    jobPosition: state.jobPosition,
    jobExperience: state.jobExperience,
    questionsAndScores,
  });

  // The LLM writes the narrative; the rating is computed so it always matches the per-question scores.
  const scores = answers.map(a => a.score);
  const summary = {
    ...generated,
    overallRating: scores.length
      ? `${(scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)}/10`
      : "N/A",
  };

  await db.update(InterviewSession)
    .set({
      status: "completed",
      overallRating: summary.overallRating,
      summary: JSON.stringify(summary),
      completedAt: new Date(),
    })
    .where(eq(InterviewSession.sessionId, state.sessionId));

  return { summary, shouldEnd: true };
}
