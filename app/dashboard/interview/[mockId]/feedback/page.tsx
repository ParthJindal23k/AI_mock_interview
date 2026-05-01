import React from 'react'
import { db } from '@/utils/db'
import { InterviewSession, InterviewQuestion, InterviewAnswer } from "@/utils/schema"
import { eq } from 'drizzle-orm'
import FeedbackClient from './FeedbackClient'

async function Feedback({
  params,
}: {
  params: { mockId: string }
}) {
  const sessionId = (await params).mockId

  // Load session
  const sessions = await db.select().from(InterviewSession)
    .where(eq(InterviewSession.sessionId, sessionId))

  if (!sessions.length) {
    return <div className="p-10 text-gray-500">Session not found</div>
  }

  const session = sessions[0]

  // Load questions + answers
  const questions = await db.select().from(InterviewQuestion)
    .where(eq(InterviewQuestion.sessionId, sessionId))
    .orderBy(InterviewQuestion.questionNumber)

  const answers = await db.select().from(InterviewAnswer)
    .where(eq(InterviewAnswer.sessionId, sessionId))

  const answersMap = new Map(answers.map(a => [a.questionId, a]))

  const result = questions.map((q) => {
    const a = answersMap.get(q.id)
    return {
      id: q.id,
      questionNumber: q.questionNumber,
      question: q.question,
      difficulty: q.difficulty,
      expectedAnswer: q.expectedAnswer,
      userAnswer: a?.userAnswer ?? "",
      correctAns: q.expectedAnswer,
      feedback: a?.feedback ?? "",
      rating: a?.score != null ? `${a.score}/10` : undefined,
      strengths: a?.strengths ?? "",
      weaknesses: a?.weaknesses ?? "",
      areasOfImprovement: a?.areasOfImprovement ?? "",
    }
  })

  const summary = session.summary ? JSON.parse(session.summary) : null

  return (
    <FeedbackClient
      mockId={sessionId}
      result={result}
      summary={summary}
      overallRating={session.overallRating}
    />
  )
}

export default Feedback
