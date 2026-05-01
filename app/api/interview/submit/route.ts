import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";
import { runProcessAnswer } from "@/lib/langgraph/workflow";
import { eq } from "drizzle-orm";
import type { InterviewState } from "@/lib/langgraph/state";

/**
 * POST /api/interview/submit
 *
 * Submits a user's answer and triggers the full LangGraph pipeline:
 * evaluateAnswer → generateFeedback → adjustDifficulty → (nextQuestion | summary)
 */
export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.emailAddresses?.length) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, userAnswer } = await req.json();

    if (!sessionId || !userAnswer) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userAnswer" },
        { status: 400 }
      );
    }

    // 1. Load session state from DB
    const sessions = await db.select()
      .from(InterviewSession)
      .where(eq(InterviewSession.sessionId, sessionId));

    if (!sessions.length) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Interview session is no longer active" },
        { status: 400 }
      );
    }

    // 2. Restore LangGraph state and inject user answer
    const previousState = session.sessionState as unknown as InterviewState;

    if (!previousState || !previousState.currentQuestion) {
      return NextResponse.json(
        { error: "Invalid session state — no current question" },
        { status: 400 }
      );
    }

    const stateWithAnswer: InterviewState = {
      ...previousState,
      currentUserAnswer: userAnswer,
    };

    // 3. Run LangGraph pipeline — returns captured eval/feedback + final state
    const { finalState, capturedEvaluation, capturedFeedback } =
      await runProcessAnswer(stateWithAnswer);

    // 4. Persist updated state
    await db.update(InterviewSession)
      .set({
        sessionState: finalState as unknown as Record<string, unknown>,
        questionsAsked: finalState.questionsAsked,
        currentDifficulty: finalState.currentDifficulty,
        ...(finalState.shouldEnd ? {
          status: "completed",
          overallRating: finalState.summary?.overallRating,
          summary: JSON.stringify(finalState.summary),
          completedAt: new Date(),
        } : {}),
      })
      .where(eq(InterviewSession.sessionId, sessionId));

    // 5. Return results — use CAPTURED values (not from finalState, which cleared them)
    return NextResponse.json({
      evaluation: capturedEvaluation,
      feedback: capturedFeedback,
      nextQuestion: finalState.shouldEnd ? null : finalState.currentQuestion,
      difficulty: finalState.currentDifficulty,
      questionNumber: finalState.questionsAsked,
      totalQuestions: finalState.maxQuestions,
      shouldEnd: finalState.shouldEnd,
      summary: finalState.summary || null,
    });
  } catch (error: any) {
    console.error("Answer submission failed:", error);
    return NextResponse.json(
      { error: "Failed to process answer", details: error.message },
      { status: 500 }
    );
  }
}
