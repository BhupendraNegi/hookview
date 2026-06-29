"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Purple-gradient CTA with the design's lift-on-hover shadow. */
export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={
        "group inline-flex items-center gap-2.5 rounded-btn px-7 py-[15px] " +
        "text-[16px] font-bold text-white shadow-btn transition-all duration-150 " +
        "hover:-translate-y-0.5 hover:shadow-btnHover disabled:cursor-not-allowed " +
        "disabled:opacity-70 " +
        className
      }
      style={{ background: "linear-gradient(180deg,#7c5cff,#6a45f0)" }}
    >
      {children}
    </button>
  );
}
