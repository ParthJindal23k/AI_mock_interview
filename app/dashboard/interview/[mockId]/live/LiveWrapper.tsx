"use client"

import dynamic from "next/dynamic"

// Dynamic import with SSR disabled — prevents "window is not defined"
// from react-webcam and react-hook-speech-to-text
const LiveInterviewClient = dynamic(
  () => import("./LiveInterviewClient"),
  {
    ssr: false,
    loading: () => (
      <div className="p-10 text-center text-gray-500">Loading interview...</div>
    ),
  }
)

type LiveWrapperProps = {
  sessionId: string
  initialQuestion: any
  initialDifficulty: string
  initialQuestionNumber: number
  maxQuestions: number
}

export default function LiveWrapper(props: LiveWrapperProps) {
  return <LiveInterviewClient {...props} />
}
