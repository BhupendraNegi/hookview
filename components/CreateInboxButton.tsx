"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./PrimaryButton";
import { ArrowRightIcon } from "./icons";

/** Creates an inbox via the API, then routes to its dashboard. */
export function CreateInboxButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox/create", { method: "POST" });
      const { id } = await res.json();
      router.push(`/inbox/${id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <PrimaryButton onClick={create} disabled={loading}>
      {loading ? "Creating…" : label}
      <ArrowRightIcon
        className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5"
        strokeWidth={2.4}
      />
    </PrimaryButton>
  );
}
