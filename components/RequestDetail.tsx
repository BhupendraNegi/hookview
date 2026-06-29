"use client";

import { useState } from "react";
import type { CapturedRequest } from "@/lib/types";
import { MethodBadge } from "./MethodBadge";
import { KeyValueTable } from "./HeadersTable";
import { JsonBody } from "./JsonBody";
import { ChevronLeftIcon } from "./icons";
import { exact } from "@/lib/time";

type Tab = "headers" | "query" | "body";

/** Right-hand inspector panel for the selected request. */
export function RequestDetail({
  req,
  showBack,
  onBack,
}: {
  req: CapturedRequest;
  showBack: boolean;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("body");

  const headerRows = Object.entries(req.headers);
  const queryRows = Object.entries(req.query);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* header area */}
      <div className="border-b border-border px-6 pb-0 pt-5">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-ink2"
              aria-label="Back to list"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          )}
          <MethodBadge method={req.method} size="lg" />
          <span className="min-w-0 flex-1 truncate font-mono text-[15px] font-medium text-mono">
            {req.path}
          </span>
          <span className="shrink-0 text-[12.5px] text-muted">{exact(req.timestamp)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f3fa] px-3 py-1 text-[12.5px] font-semibold text-ink2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {req.source}
          </span>
          <span
            className="inline-flex items-center rounded-full px-[11px] py-1 text-[12.5px] font-bold"
            style={{ background: "#dff5ec", color: "#0f9d6e" }}
          >
            200 OK
          </span>
        </div>

        {/* tabs */}
        <div className="mt-4 flex gap-1">
          <TabBtn active={tab === "headers"} onClick={() => setTab("headers")}>
            Headers {headerRows.length}
          </TabBtn>
          <TabBtn active={tab === "query"} onClick={() => setTab("query")}>
            Query {queryRows.length}
          </TabBtn>
          <TabBtn active={tab === "body"} onClick={() => setTab("body")}>
            Body
          </TabBtn>
        </div>
      </div>

      {/* content */}
      <div className="scroll-thin min-h-0 flex-1 overflow-auto px-6 py-5">
        {tab === "headers" && <KeyValueTable rows={headerRows} />}
        {tab === "query" && (
          <KeyValueTable rows={queryRows} emptyNote="No query parameters on this request." />
        )}
        {tab === "body" && <JsonBody body={req.body} contentType={req.contentType} />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="-mb-px px-4 py-2.5 text-[14px] font-bold transition-colors"
      style={{
        color: active ? "#7c5cff" : "#8b8898",
        borderBottom: active ? "2px solid #7c5cff" : "2px solid transparent",
      }}
    >
      {children}
    </button>
  );
}
