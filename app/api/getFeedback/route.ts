import { db } from "@/utils/db"
import { UserAnswer } from "@/utils/schema"
import { eq } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await currentUser()

  if (!user || !user.emailAddresses?.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  
  const { mockId } = await req.json()

  const result = await db
    .select()
    .from(UserAnswer)
    .where(eq(UserAnswer.mockIdRef, mockId))
    .orderBy(UserAnswer.id)

  return NextResponse.json({ result })
}
