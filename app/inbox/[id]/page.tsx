"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { CapturedRequest } from "@/lib/types";
import { startVisiblePolling } from "@/lib/polling";
import { LayersIcon, TrashIcon } from "@/components/icons";
import { LiveDot } from "@/components/LiveDot";
import { CopyButton } from "@/components/CopyButton";
import { RequestListItem } from "@/components/RequestListItem";
import { RequestDetail } from "@/components/RequestDetail";
import { EmptyState } from "@/components/EmptyState";

const POLL_MS = 2000;
const NARROW = 880;

export default function InboxDashboard() {
  const { id } = useParams<{ id: string }>();

  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [, setTick] = useState(0); // drives relative-time refresh
  const [catchUrl, setCatchUrl] = useState("");

  // Catch URL is the real deployment origin so it works out of the box.
  useEffect(() => {
    setCatchUrl(`${window.location.origin}/hook/${id}`);
  }, [id]);

  // Responsive split.
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Relative-time tick.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll captured requests.
  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/inbox/${id}/requests`, { cache: "no-store" });
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      /* transient network error — next tick retries */
    }
  }, [id]);

  // Poll while visible; paused in hidden/background tabs.
  useEffect(() => startVisiblePolling(refetch, POLL_MS), [refetch]);

  // Keep a valid selection.
  const selected = useMemo(() => {
    if (requests.length === 0) return null;
    return requests.find((r) => r.id === selectedId) ?? requests[0];
  }, [requests, selectedId]);

  const clearAll = useCallback(async () => {
    await fetch(`/api/inbox/${id}/requests`, { method: "DELETE" });
    setRequests([]);
    setSelectedId(null);
    setMobileDetail(false);
  }, [id]);

  const sendTest = useCallback(async () => {
    if (!catchUrl) return;
    await fetch(catchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test.ping",
        message: "Hello from HookView 👋",
        sent_at: new Date().toISOString(),
      }),
    });
    refetch();
  }, [catchUrl, refetch]);

  const hasReq = requests.length > 0;
  // Narrow: show list OR detail. Wide: show both.
  const showList = !narrow || !mobileDetail;
  const showDetail = !narrow || mobileDetail;

  return (
    <div className="flex h-screen flex-col bg-app">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4 border-b border-border bg-white px-[22px] py-[14px]">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="grid h-[34px] w-[34px] place-items-center rounded-[10px] text-white shadow-tile"
            style={{ background: "linear-gradient(135deg,#9d7bff,#6a45f0)" }}
          >
            <LayersIcon className="h-[18px] w-[18px]" strokeWidth={2.1} />
          </span>
          <span className="text-[16px] font-extrabold tracking-[-.02em]">HookView</span>
        </Link>

        {/* copy-URL bar */}
        <div className="mx-auto flex w-full max-w-[620px] items-center gap-2.5 rounded-btn border border-border bg-[#f6f5fb] px-3.5 py-2">
          <LiveDot size={8} />
          <code className="min-w-0 flex-1 truncate font-mono text-[13.5px] text-mono">
            {catchUrl || `…/hook/${id}`}
          </code>
          <CopyButton text={catchUrl} />
        </div>

        <button
          onClick={clearAll}
          className="group flex shrink-0 items-center gap-2 rounded-btn border border-[#e7e5f0] bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink2 transition-colors hover:border-[#f3b7b3] hover:bg-[#fef5f5] hover:text-[#e5484d]"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Clear all</span>
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {!hasReq ? (
        <EmptyState url={catchUrl} onSendTest={sendTest} />
      ) : (
        <div className="flex min-h-0 flex-1">
          {showList && (
            <aside
              className="flex min-h-0 flex-col border-r border-border bg-listbg"
              style={{ flex: narrow ? "1 1 auto" : "0 0 372px" }}
            >
              <div className="flex items-center gap-2.5 px-4 py-3.5">
                <span className="text-[12px] font-bold uppercase tracking-[.06em] text-ink2">
                  Requests
                </span>
                <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-bold text-primary">
                  {requests.length}
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <LiveDot size={7} />
                  Live
                </span>
              </div>
              <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto px-2.5 pb-3">
                {requests.map((r) => (
                  <RequestListItem
                    key={r.id}
                    req={r}
                    selected={selected?.id === r.id}
                    onSelect={() => {
                      setSelectedId(r.id);
                      setMobileDetail(true);
                    }}
                  />
                ))}
              </div>
            </aside>
          )}

          {showDetail && selected && (
            <RequestDetail
              req={selected}
              showBack={narrow}
              onBack={() => setMobileDetail(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
