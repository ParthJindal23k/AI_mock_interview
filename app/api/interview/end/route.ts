import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";
import { runEndInterview } from "@/lib/langgraph/workflow";
import { eq } from "drizzle-orm";
import type { InterviewState } from "@/lib/langgraph/state";

/**
 * POST /api/interview/end
 *
 * Explicitly ends an interview early and generates a summary.
 * Called when the user clicks "End Interview" before all questions are exhausted.
 */
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user || !user.emailAddresses?.length) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const sessions = await db.select()
      .from(InterviewSession)
      .where(eq(InterviewSession.sessionId, sessionId));

    if (!sessions.length) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    if (session.status === "completed") {
      // Already completed — return existing summary
      return NextResponse.json({
        summary: session.summary ? JSON.parse(session.summary) : null,
        alreadyCompleted: true,
      });
    }

    const previousState = session.sessionState as unknown as InterviewState;

    if (!previousState) {
      return NextResponse.json({ error: "No session state found" }, { status: 400 });
    }

    // Run LangGraph summary node
    const finalState = await runEndInterview(previousState);

    return NextResponse.json({
      summary: finalState.summary,
      questionsAnswered: finalState.questionsAsked,
      totalQuestions: finalState.maxQuestions,
    });
  } catch (error: any) {
    console.error("End interview failed:", error);
    return NextResponse.json(
      { error: "Failed to end interview", details: error.message },
      { status: 500 }
    );
  }
}
