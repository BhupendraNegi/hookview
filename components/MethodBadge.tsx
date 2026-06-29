import { methodColors } from "@/lib/method";

/** Mono uppercase method badge on a tint of its hue. */
export function MethodBadge({
  method,
  size = "sm",
}: {
  method: string;
  size?: "sm" | "lg";
}) {
  const { fg, bg } = methodColors(method);
  const sm = size === "sm";
  return (
    <span
      className="shrink-0 font-mono font-semibold uppercase tracking-[.02em]"
      style={{
        color: fg,
        background: bg,
        fontSize: sm ? 11 : 13,
        padding: sm ? "4px 8px" : "6px 12px",
        borderRadius: sm ? 7 : 9,
      }}
    >
      {method}
    </span>
  );
}
