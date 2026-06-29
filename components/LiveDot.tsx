/** Blinking teal live indicator with a soft halo. */
export function LiveDot({ size = 9 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 animate-blink rounded-full bg-live"
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 0 4px rgba(22,179,166,.16)",
      }}
    />
  );
}
