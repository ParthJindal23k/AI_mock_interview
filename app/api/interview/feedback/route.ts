import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { InterviewSession, InterviewQuestion, InterviewAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/interview/feedback
 *
 * Returns the complete feedback for a session — all questions, answers,
 * evaluations, and the overall summary.
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

    // Load session
    const sessions = await db.select()
      .from(InterviewSession)
      .where(eq(InterviewSession.sessionId, sessionId));

    if (!sessions.length) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    // Load all questions
    const questions = await db.select()
      .from(InterviewQuestion)
      .where(eq(InterviewQuestion.sessionId, sessionId))
      .orderBy(InterviewQuestion.questionNumber);

    // Load all answers
    const answers = await db.select()
      .from(InterviewAnswer)
      .where(eq(InterviewAnswer.sessionId, sessionId));

    const answersMap = new Map(answers.map(a => [a.questionId, a]));

    // Combine into a single response
    const questionsWithFeedback = questions.map((q) => {
      const answer = answersMap.get(q.id);
      return {
        questionNumber: q.questionNumber,
        question: q.question,
        expectedAnswer: q.expectedAnswer,
        difficulty: q.difficulty,
        userAnswer: answer?.userAnswer ?? null,
        score: answer?.score ?? null,
        strengths: answer?.strengths ?? null,
        weaknesses: answer?.weaknesses ?? null,
        feedback: answer?.feedback ?? null,
        areasOfImprovement: answer?.areasOfImprovement ?? null,
      };
    });

    return NextResponse.json({
      session: {
        sessionId: session.sessionId,
        jobPosition: session.jobPosition,
        jobDesc: session.jobDesc,
        jobExperience: session.jobExperience,
        status: session.status,
        overallRating: session.overallRating,
        summary: session.summary ? JSON.parse(session.summary) : null,
        questionsAsked: session.questionsAsked,
        maxQuestions: session.maxQuestions,
        createdAt: session.createdAt,
      },
      questions: questionsWithFeedback,
    });
  } catch (error: any) {
    console.error("Get feedback failed:", error);
    return NextResponse.json(
      { error: "Failed to get feedback", details: error.message },
      { status: 500 }
    );
  }
}
