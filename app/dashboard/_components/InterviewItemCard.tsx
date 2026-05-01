import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function InterviewItemCard({ interview }: { interview: any }) {
  const router = useRouter()

  const statusColor =
    interview?.status === 'completed'
      ? 'text-green-600'
      : interview?.status === 'active'
        ? 'text-yellow-600'
        : 'text-gray-400'

  return (
    <div className="border shadow-sm rounded-lg p-3 max-w-sm">
      <h2 className="font-bold text-blue-700">{interview?.jobPosition}</h2>
      <h2 className="text-sm text-gray-600">
        {interview?.jobExperience} Years of Experience
      </h2>
      <h2 className="text-xs text-gray-400 mt-1">
        Difficulty: <span className="capitalize">{interview?.currentDifficulty}</span>
        {' · '}
        {interview?.questionsAsked}/{interview?.maxQuestions} Questions
      </h2>
      <h2 className={`text-xs mt-1 font-medium capitalize ${statusColor}`}>
        {interview?.status}
        {interview?.overallRating ? ` · Rating: ${interview.overallRating}` : ''}
      </h2>
      <div className="flex justify-between mt-3 gap-2">
        {interview?.status === 'active' && (
          <Button
            onClick={() => router.push(`/dashboard/interview/${interview?.sessionId}/live`)}
            size="sm"
          >
            Continue
          </Button>
        )}
        <Button
          onClick={() => router.push(`/dashboard/interview/${interview?.sessionId}/feedback`)}
          size="sm"
          variant="outline"
        >
          Feedback
        </Button>
      </div>
    </div>
  )
}

export default InterviewItemCard
