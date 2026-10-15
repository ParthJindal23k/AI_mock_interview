import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";
import { runProcessAnswer } from "@/lib/langgraph/workflow";
import { getCurrentUserEmail, getOwnedSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import type { InterviewState } from "@/lib/langgraph/state";

export const maxDuration = 60;

/**
 * POST /api/interview/submit
 *
 * Submits the user's answer and runs the LangGraph workflow (answer branch):
 * evaluateAnswer → generateFeedback → adjustDifficulty → (generateQuestion | generateSummary)
 */
export async function POST(req: Request) {
  try {
    const email = await getCurrentUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, userAnswer } = await req.json();

    if (!sessionId || !userAnswer) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userAnswer" },
        { status: 400 }
      );
    }

    const session = await getOwnedSession(sessionId, email);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Interview session is no longer active" },
        { status: 400 }
      );
    }

    const previousState = session.sessionState as unknown as InterviewState;

    if (!previousState || !previousState.currentQuestion) {
      return NextResponse.json(
        { error: "Invalid session state — no current question" },
        { status: 400 }
      );
    }

    const finalState = await runProcessAnswer(previousState, userAnswer);

    await db.update(InterviewSession)
      .set({
        sessionState: finalState as unknown as Record<string, unknown>,
        questionsAsked: finalState.questionsAsked,
        currentDifficulty: finalState.currentDifficulty,
      })
      .where(eq(InterviewSession.sessionId, sessionId));

    return NextResponse.json({
      evaluation: finalState.evaluation,
      feedback: finalState.feedback,
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
