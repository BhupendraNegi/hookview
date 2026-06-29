import { NextResponse } from "next/server";
import { newInboxId } from "@/lib/inbox";

export const dynamic = "force-dynamic";

/**
 * Mint a new inbox id. The Redis key is created lazily on the first captured
 * request, so there's nothing to persist here.
 */
export async function POST(): Promise<NextResponse> {
  const id = newInboxId();
  return NextResponse.json({ id });
}
