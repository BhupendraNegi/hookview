# Design

The product design and the design system behind HookView's UI. The exact tokens
below come from the original design handoff and are encoded in
[tailwind.config.ts](../tailwind.config.ts) — reference the semantic names, don't
scatter raw hex.

## Product intent

Make webhooks **legible**. Apps like Stripe and GitHub send small HTTP messages
("webhooks") whenever something happens; developers often have no easy way to
see exactly what's inside one. HookView gives them a free URL that catches every
request and shows precisely what arrived — method, headers, query params, and a
pretty-printed JSON body — the moment it lands.

Design principles:

- **Zero setup.** No accounts, no SDKs. One click to a working URL.
- **Live by default.** New requests stream in (via 2s polling) without a refresh.
- **Inspect, don't interpret.** Show the raw truth; never reject or normalize a
  payload.

## Screens

### 1. Landing — [app/page.tsx](../app/page.tsx)
A single scrolling page that explains the tool in plain language and drives one
action: *Create my free inbox*.

- **Hero** (≈94vh, centered): soft floating gradient blobs, an eyebrow pill
  ("Free · No signup · Real-time"), the brand wordmark, a headline with
  "in real time." in the primary purple, a plain-language paragraph, an analogy
  pill, the primary CTA, and a small "concept visual" (a URL card → a mini
  request list).
- **How it works**: three numbered step cards (Create → Point → Watch) and a
  flow diagram of a single webhook's journey, then a secondary CTA.

The CTA ([components/CreateInboxButton.tsx](../components/CreateInboxButton.tsx))
creates an inbox on first use and remembers it (in `localStorage`). On a return
visit it offers to **resume** that inbox, with an explicit secondary option to
**create a new one** — so you don't lose a URL you've already wired into a
service. Only inboxes created via this button are remembered (opening a shared
`/inbox/{id}` link never overwrites it).

### 2. Dashboard — [app/inbox/[id]/page.tsx](../app/inbox/%5Bid%5D/page.tsx)
The working screen. A fixed top bar over a split body.

- **Top bar:** logo, a **copy-URL bar** (blinking live dot + the real catch URL +
  a Copy button that flips to "✓ Copied" + teal for 1.6s), and a **Clear all**
  button (turns red on hover).
- **Left panel (list):** a "REQUESTS" header with a count pill and a "Live"
  indicator, then request rows (newest first). Each row
  ([components/RequestListItem.tsx](../components/RequestListItem.tsx)) shows a
  method badge, a preview title, a mono `source · path`, and a relative time.
  The selected row is tinted purple.
- **Right panel (detail)** —
  [components/RequestDetail.tsx](../components/RequestDetail.tsx): a large method
  badge + path + exact timestamp, a source chip and a `200 OK` status pill, then
  tabs:
  - **Headers** / **Query** → a two-column key/value table
    ([components/HeadersTable.tsx](../components/HeadersTable.tsx)); empty query
    shows a friendly note.
  - **Body** → a JSON viewer
    ([components/JsonBody.tsx](../components/JsonBody.tsx)) with a **Pretty/Raw**
    toggle. Pretty is syntax-highlighted; Raw is the verbatim text. No body shows
    a note.

### 3. Empty state — [components/EmptyState.tsx](../components/EmptyState.tsx)
Shown inside the dashboard until the first webhook arrives: a pulsing radar
illustration, a heading, the URL with a Copy button, and a **Send a test
webhook** button that fires a real `POST` at the catcher (so it lands through the
normal poll path).

## Design system

### Color tokens
| Token (Tailwind) | Hex | Use |
|---|---|---|
| `primary` | `#7c5cff` | Brand, primary buttons, active states, JSON keys |
| `primary-end` | `#6a45f0` | Gradient bottom |
| `primary-light` | `#9d7bff` | Logo tile gradient top |
| `primary-tint` | `#f0ecff` | Soft purple chip/badge background |
| `primary-tintborder` | `#ddd2ff` | Borders on purple chips |
| `coral` | `#ff6b5e` | Accent (used sparingly) |
| `app` | `#f5f4fb` | Page background |
| `listbg` | `#faf9fd` | Request-list column |
| `surface` | `#ffffff` | Cards, panels, top bar |
| `ink` / `ink2` | `#211f33` / `#6a6781` | Text primary / secondary |
| `muted` | `#9a97ad` | Timestamps, captions |
| `mono` | `#3a3850` | Code/value text |
| `live` | `#16b3a6` | Live indicator (teal) |

### Method badge colors ([lib/method.ts](../lib/method.ts))
Mono uppercase text on a light tint of the same hue:
GET teal · POST blue · PUT amber · PATCH purple · DELETE red · HEAD/other grey.

### JSON highlighting ([lib/highlight.ts](../lib/highlight.ts))
Keys `#7c5cff` · strings `#0d9488` · numbers `#ea580c` · booleans `#e11d48` ·
null `#9b97ad`.

### Typography
- **Sans (UI):** Plus Jakarta Sans (400–800)
- **Mono (code/URLs/badges):** JetBrains Mono (400–600)

Both are loaded via `next/font` in [app/layout.tsx](../app/layout.tsx) and exposed
as the `font-sans` / `font-mono` Tailwind families.

### Radius, shadow, motion
Encoded as named tokens in [tailwind.config.ts](../tailwind.config.ts):

- **Radius:** `badge` 7px · `item` 11px · `btn` 12px · `card` 16px · `panel` 20px
  · `feature` 24px · pills/dots full.
- **Shadow:** `card`, `btn` (purple glow), `tile`, `floating`.
- **Animations:** `blink` (live dot, 2.4s), `ring` (radar pulse), `floaty-slow` /
  `floaty-fast` (hero blobs), `up` (entrance). Buttons lift `-2px` on hover.

### Responsive
Desktop-first with a breakpoint at **880px**. Wide: list + detail side by side
(list fixed 372px). Narrow: list *or* detail, with a back button when a request
is open. Implemented in the dashboard via a width listener that toggles which
panel renders.

## Mapping the design back to real data

The original design mockup used static sample requests with `source`, `preview`,
and a `status` field. In the live app:

- `source` and `preview` are **derived** at capture time (see
  [architecture.md](./architecture.md#data-model)).
- `status` is always **`200 OK`** — that's what the catcher returns to the sender.
- The displayed URL is the **real deployment origin** (`window.location.origin` +
  `/hook/{id}`), not the mockup's `hooks.hookview.dev` placeholder, so the URL
  actually works.
