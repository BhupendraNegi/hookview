import { describe, it, expect, afterEach, vi } from "vitest";
import { startVisiblePolling } from "@/lib/polling";

type VisDoc = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;

/** Minimal document stand-in: mutable visibility + visibilitychange listeners. */
function fakeDoc() {
  const listeners = new Set<EventListener>();
  const doc = {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener: ((_: string, fn: EventListener) => {
      listeners.add(fn);
    }) as Document["addEventListener"],
    removeEventListener: ((_: string, fn: EventListener) => {
      listeners.delete(fn);
    }) as Document["removeEventListener"],
  };
  return {
    doc: doc as VisDoc,
    hide: () => {
      doc.visibilityState = "hidden";
      listeners.forEach((fn) => fn(new Event("visibilitychange")));
    },
    show: () => {
      doc.visibilityState = "visible";
      listeners.forEach((fn) => fn(new Event("visibilitychange")));
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => vi.useRealTimers());

describe("startVisiblePolling", () => {
  it("calls fn immediately, then on every interval while visible", () => {
    vi.useFakeTimers();
    const { doc } = fakeDoc();
    const fn = vi.fn();

    const stop = startVisiblePolling(fn, 2000, doc);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6000);
    expect(fn).toHaveBeenCalledTimes(4);
    stop();
  });

  it("skips ticks while the document is hidden", () => {
    vi.useFakeTimers();
    const { doc, hide } = fakeDoc();
    const fn = vi.fn();

    const stop = startVisiblePolling(fn, 2000, doc);
    hide();
    vi.advanceTimersByTime(10000);
    expect(fn).toHaveBeenCalledTimes(1); // only the initial call
    stop();
  });

  it("refetches immediately on becoming visible again, then resumes polling", () => {
    vi.useFakeTimers();
    const { doc, hide, show } = fakeDoc();
    const fn = vi.fn();

    const stop = startVisiblePolling(fn, 2000, doc);
    hide();
    vi.advanceTimersByTime(10000);

    show();
    expect(fn).toHaveBeenCalledTimes(2); // catch-up fetch, no timer needed

    vi.advanceTimersByTime(4000);
    expect(fn).toHaveBeenCalledTimes(4);
    stop();
  });

  it("stop() halts polling and removes the visibility listener", () => {
    vi.useFakeTimers();
    const { doc, listenerCount } = fakeDoc();
    const fn = vi.fn();

    const stop = startVisiblePolling(fn, 2000, doc);
    expect(listenerCount()).toBe(1);

    stop();
    expect(listenerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
