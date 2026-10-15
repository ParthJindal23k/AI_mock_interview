import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";
import { runEndInterview } from "@/lib/langgraph/workflow";
import { getCurrentUserEmail, getOwnedSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import type { InterviewState } from "@/lib/langgraph/state";

export const maxDuration = 60;

/**
 * POST /api/interview/end
 *
 * Ends an interview early by running the LangGraph workflow (end branch),
 * which goes straight to generateSummary.
 */
export async function POST(req: Request) {
  try {
    const email = await getCurrentUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await getOwnedSession(sessionId, email);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "completed") {
      return NextResponse.json({
        summary: session.summary ? JSON.parse(session.summary) : null,
        alreadyCompleted: true,
      });
    }

    const previousState = session.sessionState as unknown as InterviewState;

    if (!previousState) {
      return NextResponse.json({ error: "No session state found" }, { status: 400 });
    }

    const finalState = await runEndInterview(previousState);

    await db.update(InterviewSession)
      .set({ sessionState: finalState as unknown as Record<string, unknown> })
      .where(eq(InterviewSession.sessionId, sessionId));

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
