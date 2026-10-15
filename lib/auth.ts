import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/utils/db";
import { InterviewSession } from "@/utils/schema";

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
}

/**
 * Loads a session only if it belongs to the signed-in user.
 * Returns null for both "not found" and "not yours" so session IDs can't be probed.
 */
export async function getOwnedSession(sessionId: string, email: string) {
  const [session] = await db
    .select()
    .from(InterviewSession)
    .where(and(eq(InterviewSession.sessionId, sessionId), eq(InterviewSession.createdBy, email)));
  return session ?? null;
}
