import { db } from '@/utils/db'
import { InterviewSession } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { createInitialState, runGenerateQuestion } from '@/lib/langgraph/workflow'
import { getCurrentUserEmail, getOwnedSession } from '@/lib/auth'
import LiveWrapper from './LiveWrapper'

export const maxDuration = 60

async function LiveInterviewPage({
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

  if (session.status === 'completed') {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-green-600">Interview Completed</h2>
        <p className="text-gray-500 mt-2">This interview has already been completed.</p>
        <a href={`/dashboard/interview/${sessionId}/feedback`}
          className="text-blue-600 underline mt-4 inline-block">
          View Feedback
        </a>
      </div>
    )
  }

  // Extract current question from session state
  let sessionState = session.sessionState as any
  let currentQuestion = sessionState?.currentQuestion || null

  // Recovery: if session has no state or no question, generate one now
  if (!currentQuestion) {
    try {
      const initialState = createInitialState({
        sessionId,
        jobPosition: session.jobPosition,
        jobDesc: session.jobDesc,
        jobExperience: session.jobExperience,
        maxQuestions: session.maxQuestions,
      })

      const stateAfterQuestion = await runGenerateQuestion(initialState)

      await db.update(InterviewSession)
        .set({
          sessionState: stateAfterQuestion as unknown as Record<string, unknown>,
          questionsAsked: stateAfterQuestion.questionsAsked,
        })
        .where(eq(InterviewSession.sessionId, sessionId))

      sessionState = stateAfterQuestion
      currentQuestion = stateAfterQuestion.currentQuestion
    } catch (error) {
      console.error("Failed to recover session:", error)
      return (
        <div className="p-10 text-center">
          <h2 className="text-xl font-bold text-red-600">Failed to load interview</h2>
          <p className="text-gray-500 mt-2">Could not generate a question. Please try creating a new interview.</p>
          <a href="/dashboard" className="text-blue-600 underline mt-4 inline-block">
            Back to Dashboard
          </a>
        </div>
      )
    }
  }

  return (
    <LiveWrapper
      sessionId={sessionId}
      initialQuestion={currentQuestion}
      initialDifficulty={sessionState?.currentDifficulty || session.currentDifficulty}
      initialQuestionNumber={sessionState?.questionsAsked || session.questionsAsked}
      maxQuestions={session.maxQuestions}
    />
  )
}

export default LiveInterviewPage
