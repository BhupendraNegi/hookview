"use client";

import { useMemo, useState } from "react";
import { renderBody } from "@/lib/highlight";

/** Body tab: content-type label + Pretty/Raw toggle + highlighted <pre>. */
export function JsonBody({
  body,
  contentType,
}: {
  body: string | null;
  contentType: string;
}) {
  const [raw, setRaw] = useState(false);

  const rendered = useMemo(() => (body ? renderBody(body) : null), [body]);

  if (!body || !rendered) {
    return (
      <div className="py-16 text-center text-[14px] text-ink2">This request had no body.</div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[12px] text-muted">
          {contentType || (rendered.isJson ? "application/json" : "text/plain")}
        </span>
        <div className="flex gap-1 rounded-lg bg-[#f1f0f7] p-1">
          <Seg active={!raw} onClick={() => setRaw(false)}>
            Pretty
          </Seg>
          <Seg active={raw} onClick={() => setRaw(true)}>
            Raw
          </Seg>
        </div>
      </div>

      <pre
        className="scroll-thin overflow-auto rounded-[13px] border border-border bg-subtle2 p-4 font-mono text-[13px]"
        style={{ lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {raw ? (
          rendered.raw
        ) : (
          <code dangerouslySetInnerHTML={{ __html: rendered.prettyHtml }} />
        )}
      </pre>
    </div>
  );
}

function Seg({
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
      className="rounded-md px-3.5 py-[5px] text-[12.5px] font-semibold transition-colors"
      style={{
        background: active ? "#fff" : "transparent",
        color: active ? "#7c5cff" : "#8b8898",
        boxShadow: active ? "0 1px 3px rgba(33,31,51,.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}
