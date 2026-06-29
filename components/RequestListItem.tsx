"use client";

import { MethodBadge } from "./MethodBadge";
import type { CapturedRequest } from "@/lib/types";
import { rel } from "@/lib/time";

/** One row in the left request list. */
export function RequestListItem({
  req,
  selected,
  onSelect,
}: {
  req: CapturedRequest;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-[11px] rounded-item border px-[13px] py-[11px] text-left transition-colors"
      style={{
        borderColor: selected ? "#ddd2ff" : "transparent",
        background: selected ? "#f0ecff" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = "#f2effb";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = "transparent";
      }}
    >
      <MethodBadge method={req.method} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-ink">{req.preview}</span>
        <span className="block truncate font-mono text-[11.5px] text-muted">
          {req.source} · {req.path}
        </span>
      </span>
      <span className="shrink-0 text-[12px] font-semibold text-muted">{rel(req.timestamp)}</span>
    </button>
  );
}
