"use client";

import { useState, useRef, useEffect } from "react";

/** Copies `text`, then shows "✓ Copied" + teal background for 1600ms. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function copy() {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard may be unavailable (e.g. insecure context) */
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 rounded-badgelg px-[15px] py-2 text-[13px] font-bold text-white transition-all duration-150"
      style={{
        background: copied ? "#16b3a6" : "linear-gradient(135deg,#7c5cff,#6a45f0)",
        boxShadow: "0 4px 12px rgba(124,92,255,.3)",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
