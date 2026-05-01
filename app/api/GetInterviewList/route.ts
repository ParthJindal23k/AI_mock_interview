import { db } from "@/utils/db"
import { desc, eq } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { MockInterview } from "@/utils/schema"

export async function POST(req: Request) {
  const user = await currentUser();

  if (!user || !user.primaryEmailAddress?.emailAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.primaryEmailAddress.emailAddress;

  const result = await db
    .select()
    .from(MockInterview)
    .where(eq(MockInterview.createdBy, email))
    .orderBy(desc(MockInterview.id));

  return NextResponse.json({ result });
}

