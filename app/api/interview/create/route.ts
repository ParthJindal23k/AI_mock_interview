import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";
import { createInitialState, runGenerateQuestion } from "@/lib/langgraph/workflow";
import { getCurrentUserEmail } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

/**
 * POST /api/interview/create
 *
 * Creates a new adaptive interview session and runs the LangGraph workflow
 * (start branch) to produce the first question.
 */
export async function POST(req: Request) {
  try {
    const email = await getCurrentUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobPosition, jobDesc, jobExperience } = await req.json();

    if (!jobPosition || !jobDesc || !jobExperience) {
      return NextResponse.json(
        { error: "Missing required fields: jobPosition, jobDesc, jobExperience" },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();
    const maxQuestions = Number(process.env.INTERVIEW_QUESTION_COUNT) || 5;

    await db.insert(InterviewSession).values({
      sessionId,
      jobPosition,
      jobDesc,
      jobExperience: String(jobExperience),
      createdBy: email,
      maxQuestions,
      currentDifficulty: "medium",
      status: "active",
    });

    const initialState = createInitialState({
      sessionId,
      jobPosition,
      jobDesc,
      jobExperience: String(jobExperience),
      maxQuestions,
    });

    let stateAfterQuestion;
    try {
      stateAfterQuestion = await runGenerateQuestion(initialState);
    } catch (error) {
      await db.delete(InterviewSession).where(eq(InterviewSession.sessionId, sessionId));
      throw error;
    }

    await db.update(InterviewSession)
      .set({
        sessionState: stateAfterQuestion as unknown as Record<string, unknown>,
        questionsAsked: stateAfterQuestion.questionsAsked,
      })
      .where(eq(InterviewSession.sessionId, sessionId));

    return NextResponse.json({
      sessionId,
      question: stateAfterQuestion.currentQuestion,
      questionNumber: stateAfterQuestion.questionsAsked,
      difficulty: stateAfterQuestion.currentDifficulty,
      totalQuestions: maxQuestions,
    });
  } catch (error: any) {
    console.error("Interview creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create interview", details: error.message },
      { status: 500 }
    );
  }
}
