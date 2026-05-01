import { InterviewState } from "./state";
import {
  generateQuestionChain,
  evaluateAnswerChain,
  generateFeedbackChain,
  generateSummaryChain,
} from "../langchain/chains";
import { storeAnswerEmbedding, retrieveSimilarAnswers } from "../rag/vectorstore";
import { db } from "@/utils/db";
import { InterviewQuestion, InterviewAnswer, InterviewSession } from "@/utils/schema";
import { eq } from "drizzle-orm";

/**
 * Node 1: Generate Question
 * Dynamically generates ONE question based on current difficulty and previous topics.
 * Stores the question in DB and embeds the expected answer in Pinecone.
 */
export async function generateQuestion(state: InterviewState): Promise<Partial<InterviewState>> {
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

  // Store question in DB
  const [inserted] = await db.insert(InterviewQuestion).values({
    sessionId: state.sessionId,
    questionNumber,
    question: result.question,
    expectedAnswer: result.expectedAnswer,
    difficulty: state.currentDifficulty,
    topicsCovered: result.topic,
  }).returning({ id: InterviewQuestion.id });

  // Store expected answer embedding in Pinecone (grows the knowledge base)
  try {
    const embeddingId = await storeAnswerEmbedding(result.expectedAnswer, {
      sessionId: state.sessionId,
      questionId: inserted.id,
      difficulty: state.currentDifficulty,
      jobPosition: state.jobPosition,
      type: "expected",
    });

    // Update embedding reference in DB
    await db.update(InterviewQuestion)
      .set({ embeddingId })
      .where(eq(InterviewQuestion.id, inserted.id));
  } catch (error) {
    console.error("Embedding storage failed (non-fatal):", error);
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
    // Clear previous turn outputs
    evaluation: null,
    feedback: null,
    ragContext: null,
    currentUserAnswer: null,
  };
}

/**
 * Node 2: Evaluate Answer
 * Uses RAG to retrieve similar answers, then evaluates the user's answer
 * against the expected answer + retrieved context.
 */
export async function evaluateAnswer(state: InterviewState): Promise<Partial<InterviewState>> {
  if (!state.currentQuestion || !state.currentUserAnswer) {
    throw new Error("Cannot evaluate: missing question or user answer");
  }

  // RAG: Retrieve similar high-quality answers for context
  let ragContext = "No reference answers available.";
  try {
    ragContext = await retrieveSimilarAnswers(
      state.currentUserAnswer,
      { jobPosition: state.jobPosition },
      3
    );
  } catch (error) {
    console.error("RAG retrieval failed (non-fatal):", error);
  }

  // Evaluate using LangChain chain with RAG context
  const evaluation = await evaluateAnswerChain({
    question: state.currentQuestion.question,
    expectedAnswer: state.currentQuestion.expectedAnswer,
    userAnswer: state.currentUserAnswer,
    ragContext,
  });

  // If user scored well (8+), store their answer in Pinecone too
  if (evaluation.score >= 8) {
    try {
      await storeAnswerEmbedding(state.currentUserAnswer, {
        sessionId: state.sessionId,
        questionId: state.currentQuestion.id,
        difficulty: state.currentDifficulty,
        jobPosition: state.jobPosition,
        type: "user",
      });
    } catch (error) {
      console.error("User answer embedding failed (non-fatal):", error);
    }
  }

  return {
    evaluation,
    ragContext,
    recentScores: [...state.recentScores, evaluation.score],
  };
}

/**
 * Node 3: Generate Feedback
 * Produces actionable improvement feedback based on the evaluation.
 * Stores the complete answer record in the database.
 */
export async function generateFeedback(state: InterviewState): Promise<Partial<InterviewState>> {
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

  // Store answer + evaluation + feedback in DB
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
 * Node 4: Adjust Difficulty
 * Adapts the difficulty level based on recent scores.
 * Determines whether the interview should end.
 */
export async function adjustDifficulty(state: InterviewState): Promise<Partial<InterviewState>> {
  let newDifficulty = state.currentDifficulty;
  const scores = state.recentScores;
  const lastTwo = scores.slice(-2);

  if (lastTwo.length >= 2) {
    const avg = lastTwo.reduce((a, b) => a + b, 0) / lastTwo.length;

    if (avg >= 8 && newDifficulty !== "hard") {
      newDifficulty = newDifficulty === "easy" ? "medium" : "hard";
    } else if (avg <= 4 && newDifficulty !== "easy") {
      newDifficulty = newDifficulty === "hard" ? "medium" : "easy";
    }
  }

  const shouldEnd = state.questionsAsked >= state.maxQuestions;

  // Update session state in DB
  await db.update(InterviewSession)
    .set({
      currentDifficulty: newDifficulty,
      questionsAsked: state.questionsAsked,
      sessionState: { ...state, currentDifficulty: newDifficulty, shouldEnd } as unknown as Record<string, unknown>,
    })
    .where(eq(InterviewSession.sessionId, state.sessionId));

  return {
    currentDifficulty: newDifficulty,
    shouldEnd,
  };
}

/**
 * Node 5: Generate Summary
 * Produces a final interview summary after all questions are answered.
 * Updates the session as completed.
 */
export async function generateSummary(state: InterviewState): Promise<Partial<InterviewState>> {
  // Load all Q&A pairs for this session
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

  const summary = await generateSummaryChain({
    jobPosition: state.jobPosition,
    jobExperience: state.jobExperience,
    questionsAndScores,
  });

  // Mark session as completed
  await db.update(InterviewSession)
    .set({
      status: "completed",
      overallRating: summary.overallRating,
      summary: JSON.stringify(summary),
      completedAt: new Date(),
    })
    .where(eq(InterviewSession.sessionId, state.sessionId));

  return { summary };
}
