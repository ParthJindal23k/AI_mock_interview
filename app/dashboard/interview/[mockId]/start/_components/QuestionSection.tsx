import React from 'react'
import { Lightbulb } from 'lucide-react'
import { Volume2  } from 'lucide-react'

function QuestionSection({
  mockInterviewQuestions,
  activeQuestionIndex,
}: {
  mockInterviewQuestions: any[]
  activeQuestionIndex: number
}) {

  const textToSpeech = (text:any)=>{
    if('speechSynthesis' in window){
      const speech = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(speech)
    }
    else{
      alert('Sorry, your browser does not support text to speech')
    }
  }

  return (
    <div className="p-5 border rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {mockInterviewQuestions.map((_, index) => (
          <h2
            key={index}
            className={`p-2 rounded-full text-xs md:text-sm text-center cursor-pointer
              ${
                activeQuestionIndex === index
                  ? 'bg-blue-800 text-white'
                  : 'bg-secondary'
              }`}
          >
            Question #{index + 1}
          </h2>
        ))}
      </div>

      <div className="mt-5 p-4 border rounded-lg">
        <h2 className="text-md md:text-lg">
          {mockInterviewQuestions?.[activeQuestionIndex]?.question}
        </h2>
        
      </div>

        <Volume2 className='cursor-pointer my-5 mx-4' onClick={()=>textToSpeech(mockInterviewQuestions?.[activeQuestionIndex]?.question)}/>

      <div className="border rounded-lg p-5 bg-blue-100 my-10">
            <h2 className='flex gap-2 items-center text-blue-700'>
                <Lightbulb/>
                <strong>Note:</strong>
            </h2>
            <h2 className='text-sm text-blue-700 my-2'>{process.env.NEXT_PUBLIC_INFORMATION_START}</h2>
        </div>
    </div>
  )
}

export default QuestionSection
