import React from 'react'
import { db } from '@/utils/db'
import { InterviewQuestion, InterviewAnswer } from "@/utils/schema"
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { getCurrentUserEmail, getOwnedSession } from '@/lib/auth'
import FeedbackClient from './FeedbackClient'

async function Feedback({
  params,
}: {
  params: Promise<{ mockId: string }>
}) {
  const sessionId = (await params).mockId

  const email = await getCurrentUserEmail()
  const session = email ? await getOwnedSession(sessionId, email) : null

  if (!session) {
    notFound()
  }

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
