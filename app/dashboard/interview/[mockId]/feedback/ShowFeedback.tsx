"use client"
import React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type FeedbackItem = {
  id?: number
  questionNumber?: number
  question: string
  difficulty?: string
  userAnswer: string
  correctAns: string
  feedback: string
  rating?: string
  strengths?: string
  weaknesses?: string
  areasOfImprovement?: string
}

function ShowFeedback({
  result,
  summary,
  overallRating,
}: {
  result: FeedbackItem[]
  summary?: any
  overallRating?: string | null
}) {
  const router = useRouter()

  // Calculate average from "X/10" format ratings
  const averageRating = (() => {
    if (overallRating) return overallRating
    const numericRatings = result
      .map(item => {
        if (!item.rating) return null
        const value = Number(item.rating.split("/")[0])
        return isNaN(value) ? null : value
      })
      .filter((v): v is number => v !== null)

    if (numericRatings.length === 0) return null
    const avg = numericRatings.reduce((sum, r) => sum + r, 0) / numericRatings.length
    return `${avg.toFixed(1)}/10`
  })()

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {result?.length == 0 ? (
        <h2 className="font-bold text-xl text-gray-500">
          No Interview Feedback Record Found
        </h2>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-green-500">
            Congratulations!
          </h2>
          <h2 className="font-bold text-2xl">
            Here is your interview feedback
          </h2>

          <h2 className="text-blue-700 text-lg my-3">
            Your overall interview rating:{" "}
            <strong>{averageRating ?? "N/A"}</strong>
          </h2>

          {/* Summary Section */}
          {summary && (
            <div className="my-6 space-y-3">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h3 className="font-semibold text-green-800">Top Strengths</h3>
                <p className="text-green-700 mt-1 text-sm">{summary.strengths}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h3 className="font-semibold text-red-800">Areas to Improve</h3>
                <p className="text-red-700 mt-1 text-sm">{summary.weaknesses}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-blue-800">Recommendations</h3>
                <p className="text-blue-700 mt-1 text-sm">{summary.recommendations}</p>
              </div>
            </div>
          )}

          <h2 className="text-sm text-gray-500 mb-6">
            Find below interview questions with correct answer, your answer and
            feedback
          </h2>

          <div className="space-y-3">
            {result.map((item) => (
              <Collapsible className="mt-4" key={item.id ?? item.question}>
                <CollapsibleTrigger className="p-3 bg-secondary rounded-lg text-left flex justify-between items-center w-full gap-2">
                  <div className="flex-1">
                    <span className="text-sm">
                      {item.questionNumber ? `Q${item.questionNumber}. ` : ""}
                      {item.question}
                    </span>
                    {item.difficulty && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs capitalize ${
                        item.difficulty === "easy" ? "bg-green-100 text-green-700" :
                        item.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {item.difficulty}
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="h-5 w-5 shrink-0" />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="flex flex-col gap-2 mt-2">
                    {item.rating && (
                      <p className="text-red-500 border p-2 rounded-lg">
                        <strong>Rating:</strong> {item.rating}
                      </p>
                    )}
                    {item.strengths && (
                      <p className="p-2 border rounded-lg bg-green-50 text-sm text-green-900">
                        <strong>Strengths:</strong> {item.strengths}
                      </p>
                    )}
                    {item.weaknesses && (
                      <p className="p-2 border rounded-lg bg-orange-50 text-sm text-orange-900">
                        <strong>Weaknesses:</strong> {item.weaknesses}
                      </p>
                    )}
                    <p className="p-2 border rounded-lg bg-red-50 text-sm text-red-900">
                      <strong>Your Answer:</strong> {item.userAnswer || "Not answered"}
                    </p>
                    <p className="p-2 border rounded-lg bg-green-50 text-sm text-green-900">
                      <strong>Expected Answer:</strong> {item.correctAns}
                    </p>
                    <p className="p-2 border rounded-lg bg-blue-50 text-sm text-blue-700">
                      <strong>Feedback:</strong> {item.feedback || "No feedback available"}
                    </p>
                    {item.areasOfImprovement && (
                      <p className="p-2 border rounded-lg bg-purple-50 text-sm text-purple-700">
                        <strong>Study:</strong> {item.areasOfImprovement}
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </>
      )}

      <Button
        onClick={() => router.push("/dashboard")}
        className="mt-8 px-8 py-2 text-base font-semibold"
      >
        Go Home
      </Button>
    </div>
  )
}

export default ShowFeedback
