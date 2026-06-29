"use client";

import { ActivityIcon } from "./icons";
import { CopyButton } from "./CopyButton";

/** Shown in the body area while no webhooks have arrived yet. */
export function EmptyState({
  url,
  onSendTest,
}: {
  url: string;
  onSendTest: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      {/* pulsing radar */}
      <div className="relative mb-8 grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-ring rounded-2xl border-2 border-[#c9b8ff]" />
        <span
          className="absolute inset-0 animate-ring rounded-2xl border-2 border-[#c9b8ff]"
          style={{ animationDelay: "1.3s" }}
        />
        <span
          className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-tile"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a45f0)" }}
        >
          <ActivityIcon className="h-7 w-7" />
        </span>
      </div>

      <h2 className="text-[26px] font-extrabold tracking-[-.02em]">
        Waiting for your first webhook…
      </h2>
      <p className="mt-3 max-w-[440px] text-[16px] leading-[1.6] text-ink2">
        Paste this URL into Stripe, GitHub, or any service&apos;s webhook settings. Requests show
        up here the instant they arrive.
      </p>

      <div className="mt-7 flex w-full max-w-[520px] items-center gap-2 rounded-btn border border-border bg-[#f6f5fb] p-2 pl-4">
        <code className="min-w-0 flex-1 truncate text-left font-mono text-[13.5px] text-mono">
          {url}
        </code>
        <CopyButton text={url} />
      </div>

      <button
        onClick={onSendTest}
        className="mt-4 rounded-btn border border-primary-tintborder bg-primary-tint px-5 py-3 text-[14px] font-bold text-primary-end transition-colors hover:bg-[#e7e0ff]"
      >
        Send a test webhook
      </button>
    </div>
  );
}
