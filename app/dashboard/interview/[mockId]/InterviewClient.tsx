"use client"
import { WebcamIcon, Lightbulb } from 'lucide-react'
import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function InterviewClient({ sessionId, interview }: {
  sessionId: string,
  interview: any
}) {
  const [webCamEnabled, setwebCamEnabled] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();

  // Release camera stream before navigating to live page
  const handleStartInterview = useCallback(() => {
    // Stop all camera tracks to free the device
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setwebCamEnabled(false);

    // Small delay to ensure camera is released before navigating
    setTimeout(() => {
      router.push(`/dashboard/interview/${sessionId}/live`);
    }, 300);
  }, [sessionId, router]);

  return (
    <div className='my-10'>
      <h2 className='font-bold text-2xl'>Let's Get Started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <div className="flex flex-col my-5 gap-5 ">
          <div className="flex flex-col  p-5 rounded-lg border gap-5">
            <h2 className='text-lg'><strong>Job Role/Job Position: </strong>{interview.jobPosition}</h2>
            <h2 className='text-lg'><strong>Job Description/Tech Stack: </strong>{interview.jobDesc}</h2>
            <h2 className='text-lg'><strong>Years of Experience: </strong>{interview.jobExperience}</h2>
            <h2 className='text-lg'><strong>Difficulty: </strong><span className="capitalize">{interview.currentDifficulty}</span></h2>
            <h2 className='text-lg'><strong>Questions: </strong>{interview.maxQuestions}</h2>
          </div>
          <div className="p-5 border rounded-lg border-yellow-300 bg-yellow-100">
            <h2 className='flex gap-2 items-center text-yellow-500'>
              <Lightbulb />
              <strong>Information</strong>
            </h2>
            <h2 className='mt-3 text-yellow-500'>
              This is an adaptive AI interview. Questions will adjust in difficulty based on your performance.
              Enable your webcam and microphone, then click Start Interview to begin.
            </h2>
          </div>
        </div>
        <div className="">
          {
            webCamEnabled ? (
              <Webcam
                ref={webcamRef}
                mirrored={true}
                audio={false}
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                }}
                onUserMedia={() => setwebCamEnabled(true)}
                onUserMediaError={() => setwebCamEnabled(false)}
                style={{ height: 350, width: "100%" }}
              />
            ) : (
              <>
                <WebcamIcon className='h-72 w-full my-7 p-20 bg-secondary' />
                <Button className='w-full' onClick={() => setwebCamEnabled(true)}>Enable Web Cam and Microphone</Button>
              </>
            )
          }
        </div>
      </div>
      <div className="flex justify-end items-center">
        <Button onClick={handleStartInterview}>Start Interview</Button>
      </div>
    </div>
  )
}

export default InterviewClient
