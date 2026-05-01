import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";
import { createInitialState, runGenerateQuestion } from "@/lib/langgraph/workflow";
import { eq } from "drizzle-orm";

/**
 * POST /api/interview/create
 *
 * Creates a new adaptive interview session.
 * 1. Authenticates the user via Clerk
 * 2. Creates an InterviewSession record in the database
 * 3. Runs the LangGraph generateQuestion node to produce the first question
 * 4. Returns the sessionId, first question, and difficulty
 */
export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.emailAddresses?.length) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0].emailAddress;
    const { jobPosition, jobDesc, jobExperience } = await req.json();

    if (!jobPosition || !jobDesc || !jobExperience) {
      return NextResponse.json(
        { error: "Missing required fields: jobPosition, jobDesc, jobExperience" },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();
    const maxQuestions = Number(process.env.INTERVIEW_QUESTION_COUNT) || 5;

    // 1. Create session in DB
    await db.insert(InterviewSession).values({
      sessionId,
      jobPosition,
      jobDesc,
      jobExperience,
      createdBy: email,
      maxQuestions,
      currentDifficulty: "medium",
      status: "active",
    });

    // 2. Initialize LangGraph state and generate first question
    const initialState = createInitialState({
      sessionId,
      jobPosition,
      jobDesc,
      jobExperience,
      maxQuestions,
    });

    const stateAfterQuestion = await runGenerateQuestion(initialState);

    // 3. Persist state to DB
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
