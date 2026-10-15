import { db } from "@/utils/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { InterviewSession } from "@/utils/schema";
import { getCurrentUserEmail } from "@/lib/auth";

/**
 * POST /api/interviews
 *
 * Returns all interview sessions for the current user, ordered by most recent.
 */
export async function POST() {
  const email = await getCurrentUserEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      id: InterviewSession.id,
      sessionId: InterviewSession.sessionId,
      jobPosition: InterviewSession.jobPosition,
      jobDesc: InterviewSession.jobDesc,
      jobExperience: InterviewSession.jobExperience,
      status: InterviewSession.status,
      currentDifficulty: InterviewSession.currentDifficulty,
      questionsAsked: InterviewSession.questionsAsked,
      maxQuestions: InterviewSession.maxQuestions,
      overallRating: InterviewSession.overallRating,
      createdAt: InterviewSession.createdAt,
    })
    .from(InterviewSession)
    .where(eq(InterviewSession.createdBy, email))
    .orderBy(desc(InterviewSession.id));

  return NextResponse.json({ result });
}
