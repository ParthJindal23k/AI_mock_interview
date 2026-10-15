import React from 'react'
import { notFound } from 'next/navigation'
import InterviewClient from "./InterviewClient"
import { getCurrentUserEmail, getOwnedSession } from '@/lib/auth'

async function page({
  params
}: {
  params: Promise<{ mockId: string }>
}) {
  const sessionId = (await params).mockId

  const email = await getCurrentUserEmail()
  const session = email ? await getOwnedSession(sessionId, email) : null

  if (!session) {
    notFound()
  }

  return (
    <InterviewClient sessionId={sessionId} interview={session} />
  )
}

export default page
