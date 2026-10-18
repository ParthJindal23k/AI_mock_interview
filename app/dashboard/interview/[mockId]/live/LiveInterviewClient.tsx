"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Volume2, Lightbulb, Loader2, ArrowRight, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import Webcam from "react-webcam"
import useSpeechToText from "react-hook-speech-to-text"
import { useRouter } from "next/navigation"

type LiveInterviewClientProps = {
  sessionId: string
  initialQuestion: { id: number; question: string; expectedAnswer: string; topic: string } | null
  initialDifficulty: string
  initialQuestionNumber: number
  maxQuestions: number
}

export default function LiveInterviewClient({
  sessionId,
  initialQuestion,
  initialDifficulty,
  initialQuestionNumber,
  maxQuestions,
}: LiveInterviewClientProps) {
  const router = useRouter()

  // ── State ──
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [questionNumber, setQuestionNumber] = useState(initialQuestionNumber)
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [userAnswer, setUserAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<any>(null)
  const [lastEvaluation, setLastEvaluation] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [interviewEnded, setInterviewEnded] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [webcamError, setWebcamError] = useState(false)

  // ── Speech-to-Text ──
  const {
    error: sttError,
    isRecording,
    results,
    setResults,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  })

  // Accumulate speech results into userAnswer
  useEffect(() => {
    if (!results.length) return
    const transcript = results
      .map((r: any) => (typeof r === "string" ? r : r.transcript))
      .join(" ")
    setUserAnswer(transcript)
  }, [results])

  // ── Text-to-Speech ──
  const speakQuestion = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // ── Recording Controls ──
  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechToText()
    } else {
      setUserAnswer("")
      setResults([])
      startSpeechToText()
    }
  }

  // ── Submit Answer ──
  const handleSubmit = async () => {
    if (!userAnswer || userAnswer.length < 10) {
      toast.error("Please provide a longer answer (speak more).")
      return
    }

    setSubmitting(true)
    if (isRecording) stopSpeechToText()

    try {
      const res = await axios.post("/api/interview/submit", {
        sessionId,
        userAnswer,
      })

      const data = res.data
      setLastEvaluation(data.evaluation)
      setLastFeedback(data.feedback)
      setDifficulty(data.difficulty)
      setQuestionNumber(data.questionNumber)
      setShowFeedback(true)

      if (data.shouldEnd) {
        setInterviewEnded(true)
        setSummary(data.summary)
      } else {
        setCurrentQuestion(data.nextQuestion)
      }

      toast.success(`Answer recorded! Score: ${data.evaluation?.score}/10`)
      setUserAnswer("")
      setResults([])
    } catch (error: any) {
      console.error("Submit failed:", error)
      toast.error("Failed to submit answer. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── End Interview Early ──
  const handleEndEarly = async () => {
    setSubmitting(true)
    try {
      const res = await axios.post("/api/interview/end", { sessionId })
      setSummary(res.data.summary)
      setInterviewEnded(true)
      toast.success("Interview ended. Summary generated!")
    } catch (error: any) {
      console.error("End interview failed:", error)
      toast.error("Failed to end interview.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Continue to Next Question ──
  const handleNext = () => {
    setShowFeedback(false)
    setLastFeedback(null)
    setLastEvaluation(null)
  }

  // ── Interview Completed View ──
  if (interviewEnded && summary) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-green-600">Interview Complete!</h2>
          <p className="text-xl text-blue-700 mt-2">
            Overall Rating: <strong>{summary.overallRating}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <h3 className="font-semibold text-green-800">Strengths</h3>
            <p className="text-green-700 mt-1">{summary.strengths}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h3 className="font-semibold text-red-800">Areas for Improvement</h3>
            <p className="text-red-700 mt-1">{summary.weaknesses}</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-800">Recommendations</h3>
            <p className="text-blue-700 mt-1">{summary.recommendations}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8 justify-center">
          <Button onClick={() => router.push(`/dashboard/interview/${sessionId}/feedback`)}>
            View Detailed Feedback
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ── Main Interview UI ──
  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6 p-3 rounded-lg bg-secondary">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Question {questionNumber} / {maxQuestions}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
            difficulty === "easy" ? "bg-green-100 text-green-700" :
            difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
            {difficulty}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleEndEarly} disabled={submitting}>
          End Interview
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Question + Feedback */}
        <div className="space-y-4">
          {/* Current Question */}
          {currentQuestion && !showFeedback && (
            <div className="p-5 border rounded-lg">
              <h2 className="text-lg font-medium">{currentQuestion.question}</h2>
              <button
                onClick={() => speakQuestion(currentQuestion.question)}
                className="mt-3 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition"
              >
                <Volume2 className="h-4 w-4" /> Listen
              </button>
            </div>
          )}

          {/* Feedback for last answer */}
          {showFeedback && lastEvaluation && lastFeedback && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold text-lg">
                  Score: <span className={
                    lastEvaluation.score >= 7 ? "text-green-600" :
                    lastEvaluation.score >= 4 ? "text-yellow-600" : "text-red-600"
                  }>{lastEvaluation.score}/10</span>
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-sm">
                <strong className="text-green-800">Strengths:</strong>
                <p className="text-green-700 mt-1">{lastEvaluation.strengths}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-sm">
                <strong className="text-red-800">Weaknesses:</strong>
                <p className="text-red-700 mt-1">{lastEvaluation.weaknesses}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-sm">
                <strong className="text-blue-800">Feedback:</strong>
                <p className="text-blue-700 mt-1">{lastFeedback.feedback}</p>
              </div>

              {!interviewEnded && (
                <Button onClick={handleNext} className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" /> Next Question
                </Button>
              )}
            </div>
          )}

          {/* Info Note */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="flex gap-2 items-center text-blue-700 text-sm">
              <Lightbulb className="h-4 w-4" />
              <strong>Adaptive Interview</strong>
            </h2>
            <p className="text-xs text-blue-600 mt-1">
              Difficulty adjusts based on your performance. High scores increase difficulty, low scores decrease it.
            </p>
          </div>
        </div>

        {/* Right: Webcam + Recording */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative rounded-lg overflow-hidden bg-black w-full" style={{ minHeight: 280 }}>
            {webcamEnabled ? (
              <Webcam
                mirrored={true}
                audio={false}
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                }}
                style={{ height: 280, width: "100%", objectFit: "cover" }}
                onUserMedia={() => setWebcamError(false)}
                onUserMediaError={(err) => {
                  console.error("Webcam error:", err)
                  setWebcamError(true)
                  setWebcamEnabled(false)
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                <Mic className="h-10 w-10 text-gray-400" />
                <Button
                  variant="outline"
                  onClick={() => { setWebcamError(false); setWebcamEnabled(true) }}
                  className="text-white border-gray-500 hover:bg-gray-700"
                >
                  Enable Webcam
                </Button>
                {webcamError && (
                  <p className="text-xs text-red-400 text-center px-4">
                    Camera unavailable — close other apps using the camera and try again.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Transcript Preview */}
          {userAnswer && (
            <div className="w-full p-3 rounded-lg border bg-gray-50 text-sm text-gray-700 max-h-32 overflow-y-auto">
              <strong>Your answer:</strong> {userAnswer}
            </div>
          )}

          {/* Recording Controls */}
          {!showFeedback && (
            <div className="flex gap-3 w-full">
              <Button
                disabled={submitting}
                variant={isRecording ? "destructive" : "outline"}
                className="flex-1"
                onClick={toggleRecording}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? "Stop Recording" : "Record Answer"}
              </Button>

              <Button
                disabled={submitting || userAnswer.length < 10}
                className="flex-1"
                onClick={handleSubmit}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Evaluating...
                  </span>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            </div>
          )}

          {sttError && (
            <p className="text-xs text-red-500">
              Speech recognition error. Please check microphone permissions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
