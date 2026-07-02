# Architecture

How HookView is put together: the stack, the request lifecycle, the data model,
and the file layout.

## What it is

HookView is a **disposable webhook inspector**. A user mints a throwaway URL,
points a service's webhooks at it, and watches requests land live. Everything is
ephemeral — captures auto-expire after 24h and there are no accounts.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router, TypeScript)** | Route Handlers give us arbitrary-method HTTP endpoints; one project serves both UI and API |
| Storage | **Upstash Redis** (`@upstash/redis`) | REST-based, so it works inside stateless serverless functions (Vercel). `LPUSH`/`LTRIM`/`EXPIRE` map 1:1 onto our data model |
| Styling | **Tailwind CSS** | Design tokens encoded once in `tailwind.config.ts` |
| Live updates | **Polling (2s)** | Vercel serverless can't cheaply hold WebSocket/SSE connections; polling is stateless and simple |
| Local Redis | **SRH** (`serverless-redis-http`) | Proxies the Upstash REST API onto a plain Redis container so the *same* client code runs locally |

**One codebase, three runtimes** — local Docker, self-hosted Docker, and Vercel.
Only the two `UPSTASH_REDIS_REST_*` env vars change between them; there is no
`if (dev)` branching anywhere.

## The big picture

```
                ┌─────────────────────────────────────────────┐
   External     │                  HookView                    │
   service ─────┼──▶ POST /hook/{id}  (the catcher)            │
   (Stripe,     │         │ reads raw body, always 200         │
   GitHub…)     │         ▼                                    │
                │     Upstash Redis   list  inbox:{id}         │
                │         ▲                                    │
   Browser  ────┼──▶ GET /api/inbox/{id}/requests  (poll 2s)   │
   (dashboard)  │     DELETE …/requests  (clear all)           │
                └─────────────────────────────────────────────┘
```

## Request lifecycle

1. **Create / resume** — Landing page button. With no remembered inbox it calls
   `POST /api/inbox/create` (returns a new `in_xxxxxxxx` id), remembers it in
   `localStorage`, and routes to `/inbox/{id}`. With a remembered inbox it offers
   to resume it (route straight there) or explicitly create a new one. (No Redis
   write at create time; the key is created lazily on the first captured request.)
2. **Capture** — An external service sends *any* HTTP request to `/hook/{id}`.
   The catcher reads the **raw body first**, collects headers + query, derives a
   friendly `source`/`preview`, stores everything, and returns `200`.
3. **Poll** — The dashboard calls `GET /api/inbox/{id}/requests` every 2 seconds
   and re-renders the list, newest first.
4. **Clear** — "Clear all" sends `DELETE /api/inbox/{id}/requests`, which deletes
   the Redis key; the dashboard falls back to the empty state.
5. **Expire** — If no new requests arrive, the key's 24h TTL elapses and Redis
   drops it automatically.

## Data model

There are **no tables**. Each inbox is a single Redis **list** at key
`inbox:{id}`. Each captured request is one JSON string in that list.

On every capture ([lib/inbox.ts](../lib/inbox.ts) → `captureRequest`):

```
LPUSH  inbox:{id}  <json>     # prepend — newest first
LTRIM  inbox:{id}  0 99       # keep only the latest 100
EXPIRE inbox:{id}  86400      # refresh the 24h TTL on every hit
```

All three are sent as a single pipeline — one REST round trip per capture.

Stored shape ([lib/types.ts](../lib/types.ts) → `CapturedRequest`):

```jsonc
{
  "id": "req_…",            // unique per captured request
  "method": "POST",
  "path": "/hook/in_4f9c2a",
  "query": { },
  "headers": { },           // keys lowercased as delivered
  "body": "…raw, verbatim…", // null if no body; capped at 256KB
  "contentType": "application/json",
  "timestamp": 1719660421000,
  "source": "Stripe",        // DERIVED (UI only)
  "preview": "charge.succeeded" // DERIVED (UI only)
}
```

`source` and `preview` are *derived* at capture time from signature headers,
the User-Agent, or a JSON `type`/`event` field — they're conveniences for the
list view, not wire data. Everything else is stored exactly as received.

## Routes

| Route | File | Purpose |
|---|---|---|
| `POST /api/inbox/create` | [app/api/inbox/create/route.ts](../app/api/inbox/create/route.ts) | Mint a new inbox id |
| `ALL /hook/[...slug]` | [app/hook/[...slug]/route.ts](../app/hook/%5B...slug%5D/route.ts) | **The catcher.** `slug[0]` = inbox id, the rest = optional subpath |
| `GET /api/inbox/[id]/requests` | [app/api/inbox/[id]/requests/route.ts](../app/api/inbox/%5Bid%5D/requests/route.ts) | Captured requests (polled) |
| `DELETE /api/inbox/[id]/requests` | same file | Clear all |

### The catcher is the critical part

[app/hook/[...slug]/route.ts](../app/hook/%5B...slug%5D/route.ts) must:

- accept **any** method (`GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS` are all bound
  to one handler),
- read the **raw body before any parsing** (`await request.text()`),
- never validate or reject — a malformed payload must still be captured,
- **always return `200`** so the sending service doesn't retry-storm,
- be a catch-all (`[...slug]`) so `/hook/{id}/some/subpath` is captured too.

It is wrapped in a `try/catch` that still returns `200` even on an internal
failure. **Do not add validation here** — with one deliberate exception: if
`slug[0]` doesn't match the minted id shape (`in_` + 8 lowercase alphanumerics,
`isInboxId`), the request still gets a `200` but is **not stored**, so bot
scanners and typo'd URLs can't create junk Redis keys.

## File layout

```
app/
  layout.tsx                      Root layout + fonts (next/font)
  globals.css                     Tailwind directives + base styles
  page.tsx                        Landing (Server Component)
  inbox/[id]/page.tsx             Dashboard (Client Component — polling, state)
  hook/[...slug]/route.ts         The catcher
  api/inbox/create/route.ts       Create an inbox
  api/inbox/[id]/requests/route.ts  Poll + clear
components/                       Presentational pieces (badges, list item,
                                  detail tabs, JSON viewer, empty state, icons…)
lib/
  redis.ts                        Lazy @upstash/redis client (getRedis())
  inbox.ts                        capture/get/clear + deriveSource/derivePreview
  types.ts                        CapturedRequest
  time.ts                         rel()/exact() timestamps
  method.ts                       method → badge colors
  highlight.ts                    JSON syntax highlighting for the Body tab
bin/                              setup · dev · lint
Dockerfile, docker-compose.yml    Local/self-host stack (app + redis + srh)
tailwind.config.ts                Design tokens
.github/workflows/ci.yml          Lint + build on push/PR
```

## Key implementation decisions

- **The Redis client is lazy** ([lib/redis.ts](../lib/redis.ts)). It's built on
  first use, not at module import, so `next build` can collect page data without
  the env vars being present (matters for the Docker image build and for any
  build that runs before secrets are injected). **Keep it lazy.**
- **Server vs Client components.** The landing page is a Server Component; only
  the small "Create inbox" button is a Client Component. The dashboard is a
  Client Component because it owns polling and interactive state. Route Handlers
  (`route.ts`) always run on the server.
- **Body size cap.** The catcher truncates stored bodies at 256KB to stay within
  the Redis free tier.

## Deployment topologies

- **Vercel:** UI + Route Handlers run as serverless functions; storage is a real
  Upstash Redis DB. No Docker.
- **Docker (local or self-host):** `docker-compose.yml` runs three services —
  `redis`, `srh` (the REST proxy), and `app` (the Next.js standalone build).

See [debugging.md](./debugging.md) for how to watch logs and inspect the data,
and [design.md](./design.md) for the UI/UX and design system.
