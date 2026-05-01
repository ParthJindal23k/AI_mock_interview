import { NextResponse } from "next/server";
import { generateAIOutput } from "@/lib/gemini";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@clerk/nextjs/server";
import moment from "moment";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {

  const user = await currentUser();

  if (!user || !user.emailAddresses?.length) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const email = user.emailAddresses[0].emailAddress;

  const { jobPosition, jobDesc, jobExperience } = await req.json();

  const questionCount =
    Number(process.env.INTERVIEW_QUESTION_COUNT) || 5;

  const prompt = `
You are a professional technical interviewer.

Job Position: ${jobPosition}
Tech Stack: ${jobDesc}
Experience: ${jobExperience} years

Generate ${questionCount} interview questions with answers.

STRICT RULES:
- Return ONLY raw JSON
- NO markdown
- NO extra text

FORMAT:
[
  {
    "question": "string",
    "answer": "string"
  }
]
`;

  const text = await generateAIOutput(prompt);

  if (!text) {
    return NextResponse.json(
      { error: "Empty response from Gemini" },
      { status: 500 }
    );
  }

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let questions;

  try {
    questions = JSON.parse(cleanedText);
  } catch (err) {
    console.error("JSON PARSE FAILED ❌");
    console.error(cleanedText);

    return NextResponse.json(
      { error: "Invalid JSON from Gemini" },
      { status: 500 }
    );
  }

  const mockId = uuidv4();

  await db.insert(MockInterview).values({
    mockId,
    jsonMockResp: JSON.stringify(questions),
    jobPosition,
    jobDesc,
    jobExperience,
    createdBy: email,
    createdAt: moment().format("DD-MM-YYYY"),
  });

  return NextResponse.json({
    mockId,
    questions,
  });
}
