import { NextResponse } from "next/server";
import { generateAIOutput } from "@/lib/gemini";
import { db } from "@/utils/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import moment from "moment";
import { UserAnswer } from "@/utils/schema";

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user || !user.emailAddresses?.length) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const email = user.emailAddresses[0].emailAddress;

  const { userAnswer, question,interviewData ,answer} = await req.json()

  const feedbackPrompt = `Question:${question},
      User Answer:${userAnswer} , Depends on the Question and User Answer for the given Interview Question, please give us rating for answer 
      and feedback as area of improvement if any , in Just 3 to 5 lines to improve it in JSON format with rating field and feedback field `

  const airesponse = await generateAIOutput(feedbackPrompt)

  let cleaned:any = airesponse

  if (typeof cleaned === "string") {
    cleaned = cleaned
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()
  }

  let parsedEvaluation
  try {
    parsedEvaluation = JSON.parse(cleaned)
  } catch (err) {
    console.error("AI JSON parse failed:", cleaned)
    return NextResponse.json(
      { error: "Invalid AI response" },
      { status: 500 }
    )
  }

  const { rating, feedback } = parsedEvaluation

  if (!rating || !feedback) {
    return NextResponse.json(
      { error: "Incomplete AI evaluation" },
      { status: 500 }
    )
  }

  const resp = await db.insert(UserAnswer).values({
    mockIdRef:interviewData?.mockId,
    question:question,
    correctAns:answer,
    userAns:userAnswer,
    feedback:feedback,
    rating:rating,
    userEmail:email,
    createdAt:moment().format('DD-MM-YYYY')

  })


  return NextResponse.json({
    success: true,
    evaluation:resp
  })


}