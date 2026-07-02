/**
 * Call `fn` immediately, then every `ms` — but skip ticks while the document
 * is hidden so a forgotten background tab doesn't keep hammering the API
 * (and the Redis behind it). On becoming visible again, refetch right away.
 *
 * Returns a stop function. `doc` is injectable for tests.
 */
export function startVisiblePolling(
  fn: () => void,
  ms: number,
  doc: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener"> = document,
): () => void {
  fn();

  const onTick = () => {
    if (doc.visibilityState === "visible") fn();
  };
  const onVisible = () => {
    if (doc.visibilityState === "visible") fn();
  };

  const timer = setInterval(onTick, ms);
  doc.addEventListener("visibilitychange", onVisible);

  return () => {
    clearInterval(timer);
    doc.removeEventListener("visibilitychange", onVisible);
  };
}
