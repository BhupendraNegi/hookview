"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./PrimaryButton";
import { ArrowRightIcon } from "./icons";

// Remember this browser's inbox so a returning visitor can resume it instead of
// losing a URL they've already wired into a service. We only remember inboxes
// created via this button — visiting a shared /inbox/{id} link never overwrites it.
const STORAGE_KEY = "hookview:inbox-id";

/**
 * Landing CTA. With no remembered inbox it creates one; once you have one it
 * offers to resume it, with an explicit option to start a new inbox instead.
 */
export function CreateInboxButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Read after mount only — localStorage isn't available during SSR, and this
  // keeps the first client render matching the server (no hydration mismatch).
  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    setRemembered(localStorage.getItem(STORAGE_KEY));
  }, []);

  function resume() {
    if (remembered) router.push(`/inbox/${remembered}`);
  }

  async function create() {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox/create", { method: "POST" });
      const { id } = await res.json();
      localStorage.setItem(STORAGE_KEY, id);
      router.push(`/inbox/${id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <PrimaryButton
        onClick={remembered ? resume : create}
        disabled={loading}
      >
        {loading ? "Opening…" : remembered ? "Resume my inbox" : label}
        <ArrowRightIcon
          className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5"
          strokeWidth={2.4}
        />
      </PrimaryButton>

      {remembered && (
        <button
          onClick={create}
          disabled={loading}
          className="text-[13px] font-medium text-ink2 underline-offset-2 hover:text-primary hover:underline disabled:opacity-60"
        >
          or create a new inbox
        </button>
      )}
    </div>
  );
}
