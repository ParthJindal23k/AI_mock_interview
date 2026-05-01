"use client"
import dynamic from "next/dynamic"

import React, { useEffect, useState } from "react"
import QuestionSection from "./_components/QuestionSection"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type QuestionPageProps = {
  mockId: string
  interview: {
    result: any[]
    jsonMockResponse: any
  }
}

function QuestionPage({ mockId, interview, }: QuestionPageProps) {
  const [interviewData, setInterviewData] = useState<any>(null)
  const [mockInterviewQuestions, setMockInterviewQuestions] = useState<any[]>([])
  const [activeQuestionIndex , setActiveQuestionIndex] = useState(0)


  const RecordAnswerSection = dynamic(
  () => import("../start/_components/RecordAnswerSection"),
  { ssr: false }
)

  useEffect(() => {
    if (interview) {
      setMockInterviewQuestions(interview.jsonMockResponse)
      setInterviewData(interview.result[0])
      console.log(interview.jsonMockResponse)
    }
  }, [interview])

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-">
          <QuestionSection  mockInterviewQuestions={mockInterviewQuestions} activeQuestionIndex={activeQuestionIndex}/>
          <RecordAnswerSection mockInterviewQuestions={mockInterviewQuestions} activeQuestionIndex={activeQuestionIndex} interviewData={interviewData}/>
        </div>
        <div className="flex justify-end gap-6">
          {activeQuestionIndex > 0 &&
          <Button onClick={()=>setActiveQuestionIndex(activeQuestionIndex-1)}>Previous Question</Button> }
          {activeQuestionIndex!= mockInterviewQuestions.length-1&&
          <Button onClick={()=>setActiveQuestionIndex(activeQuestionIndex+1)}>Next Question</Button>}
          {activeQuestionIndex== mockInterviewQuestions.length-1&&
          <Link href={`/dashboard/interview/${interviewData?.mockId}/feedback`}>
          <Button>End Interview</Button>
          </Link>}
        </div>
    </div>
  )
}

export default QuestionPage
