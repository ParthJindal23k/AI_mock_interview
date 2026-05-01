"use client"
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Mic } from 'lucide-react'
import useSpeechToText from 'react-hook-speech-to-text';
import { toast } from 'sonner'
import axios from 'axios'

function RecordAnswerSection({ mockInterviewQuestions,
  activeQuestionIndex,
  interviewData
}: {
  mockInterviewQuestions: any[]
  activeQuestionIndex: number
  interviewData: any
}) {
  const [userAnswer, setUserAnswer] = useState('')
  const {
    error,
    interimResult,
    isRecording,
    results,
    setResults,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!results.length) return

    const transcriptText = results
      .map(r => (typeof r === 'string' ? r : r.transcript))
      .join(' ')

    setUserAnswer(transcriptText)
  }, [results])


  useEffect(() => {
  if (!isRecording && results.length > 0) {
    const transcriptText = results
      .map(r => (typeof r === 'string' ? r : r.transcript))
      .join(' ')

    if (transcriptText.length > 10) {
      setUserAnswer(transcriptText)
      UpdateUserAnswer()
    }
  }
}, [results, isRecording])


  const StartStopRecording = async () => {
  if (isRecording) {
    stopSpeechToText()
  } 
  else {
    setUserAnswer('')
    setResults([])
    startSpeechToText()
  }
}


  const UpdateUserAnswer = async () => {
    setLoading(true)

    console.log("SENDING DATA 👉", {
  question: mockInterviewQuestions[activeQuestionIndex]?.question,
  answer: mockInterviewQuestions[activeQuestionIndex]?.answer,
  userAnswer,
  interviewData
})


    const response = await axios.post("/api/feedback", {
  question: mockInterviewQuestions[activeQuestionIndex]?.question,
  answer: mockInterviewQuestions[activeQuestionIndex]?.answer,
  userAnswer,
  interviewData
})


    const data = response.data

    const resp = data.evaluation
    if (resp) {
      toast('User Answer recorded successfully')
      setUserAnswer('')
      setResults([])

    }
    setLoading(false)

  }

  return (
    <div className="flex justify-center items-center flex-col">

      <div className='flex flex-col justify-center items-center my-10 rounded-lg p-5 bg-black '>
        <Image src={'/webcam.png'} alt='Webcam not available' width={200} height={200} className='absolute' />
        <Webcam mirrored={true} style={{
          height: 300,
          width: '100%',
          zIndex: 10,

        }} />
      </div>
      <Button disabled={loading} variant="outline" className='my-5' onClick={StartStopRecording}>
        {isRecording ?
          <h2 className='text-red-600 flex gap-2'>
            <Mic />Stop Recording
          </h2>
          :
          'Record Answer'}
      </Button>

    </div>
  )
}

export default RecordAnswerSection
