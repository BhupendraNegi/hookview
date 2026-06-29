import { SearchIcon } from "./icons";

/** Two-column key/value table used for both Headers and Query tabs. */
export function KeyValueTable({
  rows,
  emptyNote,
}: {
  rows: [string, string][];
  emptyNote?: string;
}) {
  if (rows.length === 0 && emptyNote) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <SearchIcon className="h-7 w-7 text-primary-tintborder" />
        <p className="text-[14px] text-ink2">{emptyNote}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[13px] border border-border">
      {rows.map(([k, v], i) => (
        <div
          key={k + i}
          className="grid gap-4 px-4 py-3"
          style={{
            gridTemplateColumns: "220px 1fr",
            borderTop: i === 0 ? "none" : "1px solid #f1f0f7",
          }}
        >
          <span className="break-words font-mono text-[12.5px] font-medium text-primary">{k}</span>
          <span className="break-words font-mono text-[12.5px] text-mono">{v}</span>
        </div>
      ))}
    </div>
  );
}
