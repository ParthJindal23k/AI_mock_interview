import QuestionPage from './QuestionPage'
import { db } from '@/utils/db'
import { MockInterview } from '@/utils/schema'
import { eq, param } from 'drizzle-orm'

async function StartInterview({
  params,
}: {
  params: { mockId: string }
}) {

  const mockId = (await params).mockId
  const result = await db
    .select()
    .from(MockInterview)
    .where(eq(MockInterview.mockId, mockId))

  const jsonMockResponse = JSON.parse(result[0].jsonMockResp)

  

  return (
    <QuestionPage
      mockId={mockId}
      interview={{
        result,
        jsonMockResponse,
      }}
    />
  )
}

export default StartInterview
