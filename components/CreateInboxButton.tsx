"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./PrimaryButton";
import { ArrowRightIcon } from "./icons";

// Remember this browser's inbox so repeat clicks resume it instead of minting a
// new one each time (and you don't lose a URL you've already wired into a service).
const STORAGE_KEY = "hookview:inbox-id";

/** Opens this browser's inbox — creating and remembering one on first use. */
export function CreateInboxButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const remembered = localStorage.getItem(STORAGE_KEY);
      if (remembered) {
        router.push(`/inbox/${remembered}`);
        return;
      }
      const res = await fetch("/api/inbox/create", { method: "POST" });
      const { id } = await res.json();
      localStorage.setItem(STORAGE_KEY, id);
      router.push(`/inbox/${id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <PrimaryButton onClick={open} disabled={loading}>
      {loading ? "Opening…" : label}
      <ArrowRightIcon
        className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5"
        strokeWidth={2.4}
      />
    </PrimaryButton>
  );
}
