import { NextRequest, NextResponse } from "next/server";
import { getRequests, clearRequests } from "@/lib/inbox";

export const dynamic = "force-dynamic";

/** Polled by the dashboard every 2s — returns captured requests, newest first. */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const requests = await getRequests(id);
  return NextResponse.json(
    { requests },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** "Clear all" — wipes every captured request for the inbox. */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  await clearRequests(id);
  return NextResponse.json({ ok: true });
}
