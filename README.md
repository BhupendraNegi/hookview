# HookView

**See exactly what your webhooks are sending — in real time.**

HookView is a disposable webhook capture & inspection tool. Click once to get a
unique URL, paste it into any service's webhook settings (Stripe, GitHub,
Shopify, …), and watch requests land live in a dashboard where you can inspect
the method, headers, query params, and a pretty-printed JSON body.

- **No accounts, nothing to install.**
- Captures **auto-expire after 24h** and the list is capped at the **last 100**
  requests per inbox.
- The catcher accepts **any** HTTP method, content-type, and body — it never
  rejects anything and always returns `200`.

## Stack

- **Next.js** (App Router, TypeScript)
- **Upstash Redis** (`@upstash/redis`) for storage — REST-based, so it works in
  Vercel's stateless functions. Data model maps onto `LPUSH` / `LTRIM` / `EXPIRE`.
- **Tailwind CSS** for styling
- **Polling** (the dashboard refetches every 2s) — no websockets needed

One codebase runs in three places (local Docker, self-hosted Docker, Vercel);
only the two env vars differ.

## Environment variables

| Var | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL (or the local SRH proxy URL) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token (or the local SRH shared token) |

See [`.env.example`](.env.example) for both the Docker and Vercel value sets.

---

## Local development — Colima + Docker (no cloud account needed)

`@upstash/redis` only speaks Upstash's REST protocol, so locally we run
[`serverless-redis-http` (SRH)](https://github.com/hiett/serverless-redis-http) —
a tiny proxy that exposes that REST API on top of a plain Redis container. The
app code is identical to production.

### Option A — everything in Docker

```bash
colima start                 # provides the Docker daemon on macOS
docker compose up --build    # starts redis + srh + the app
open http://localhost:3000
```

### Option B — app on the host, Redis in Docker

Run just the backing services in containers and the Next.js dev server natively
(faster hot reload):

```bash
colima start
docker compose up -d redis srh   # SRH is published on localhost:8079
cp .env.example .env.local        # already points at http://localhost:8079
npm install
npm run dev
open http://localhost:3000
```

> Port 3000 already taken? Run `PORT=3939 npm run dev`.

### Inspecting Redis directly

```bash
docker compose exec redis redis-cli KEYS 'inbox:*'
docker compose exec redis redis-cli TTL inbox:<id>     # ~86400
docker compose exec redis redis-cli LLEN inbox:<id>    # ≤ 100
```

---

## Deploy to Vercel

1. **Create an Upstash Redis database** at
   [console.upstash.com](https://console.upstash.com) and copy its **REST URL**
   and **REST token**.
2. Import this repo into Vercel.
3. Add the two env vars in **Project → Settings → Environment Variables**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy. Your catcher URLs will be `https://<your-app>.vercel.app/hook/<id>`.

No Docker is involved on Vercel — it uses the real Upstash database directly.

---

## Self-host with Docker

The same `docker-compose.yml` is a complete self-hosted stack (app + Redis +
SRH). Point a reverse proxy / domain at the `app` service on port 3000. For a
managed datastore instead, drop the `redis`/`srh` services and set the two
`UPSTASH_REDIS_REST_*` vars on the `app` service to a real Upstash DB.

---

## How it works

| Route | Purpose |
|---|---|
| `POST /api/inbox/create` | Mint a new inbox id (`in_xxxxxxxx`) |
| `ALL /hook/[...slug]` | **The catcher.** `slug[0]` is the inbox id; any extra path is captured too. Reads the raw body first, stores everything, always returns `200` |
| `GET /api/inbox/[id]/requests` | Captured requests for the dashboard to poll |
| `DELETE /api/inbox/[id]/requests` | Clear all captured requests |

Each captured request is stored in the Redis list `inbox:{id}` as JSON:

```jsonc
{
  "id": "req_…",
  "method": "POST",
  "path": "/hook/in_4f9c2a",
  "query": { },
  "headers": { },
  "body": "…raw body, verbatim…",
  "contentType": "application/json",
  "timestamp": 1719660421000,
  "source": "Stripe",   // derived from signature headers / User-Agent (UI only)
  "preview": "charge.succeeded"  // derived from body type/event (UI only)
}
```

## Try it locally

```bash
# create an inbox
ID=$(curl -s -X POST http://localhost:3000/api/inbox/create | sed -E 's/.*"id":"([^"]+)".*/\1/')

# fire a webhook at it (open http://localhost:3000/inbox/$ID to watch it land)
curl -X POST "http://localhost:3000/hook/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"type":"charge.succeeded","amount":4900,"currency":"usd"}'
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (standalone output for Docker) |
| `npm start` | Run the production build |
| `npm run lint` | Lint |

## Out of scope (v1)

User accounts, auth, webhook replay, custom response codes/bodies,
search/filter, multiple saved inboxes per user.
