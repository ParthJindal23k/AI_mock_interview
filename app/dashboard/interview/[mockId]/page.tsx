import React from 'react'
import InterviewClient from "./InterviewClient"
import { db } from '@/utils/db'
import { InterviewSession } from '@/utils/schema'
import { eq } from 'drizzle-orm'

async function page({
  params
}: {
  params: Promise<{ mockId: string }>
}) {
  const sessionId = (await params).mockId

  const result = await db.select().from(InterviewSession)
    .where(eq(InterviewSession.sessionId, sessionId))

  if (!result.length) {
    return <div className="p-10 text-gray-500">Interview not found</div>
  }

  return (
    <InterviewClient sessionId={sessionId} interview={result[0]} />
  )
}

export default page
