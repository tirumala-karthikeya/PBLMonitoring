import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * API routes aren't covered by the middleware matcher (only the page
 * routes are), so each protected route calls this directly.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, unauthorized: null as null };
}
