# Debugging: Logs & Data (a Next.js newcomer's guide)

New to Next.js? This is the practical "where do I look when something happens"
guide — how to read logs and how to inspect the stored data. No prior Next.js or
Redis experience assumed.

## First, the mental model

Two ideas that trip up newcomers:

1. **There are two places code runs, so there are two places logs go.**
   - **Server code** — Route Handlers (`app/**/route.ts`) and Server Components.
     Their `console.log` prints to the **terminal** where the dev server runs.
   - **Client code** — any file starting with `"use client"` (e.g. the dashboard
     and most components). Their `console.log` prints to the **browser DevTools
     console**, *not* the terminal.

   So: the catcher and the API routes → terminal. The dashboard's polling and
   button clicks → browser console.

2. **There is no SQL database and there are no tables.** "The database" is
   **Redis**, a key-value store. All of an inbox's captured requests live in a
   single Redis **list** at the key `inbox:{id}`. Each list element is one
   request stored as a JSON string. (See
   [architecture.md](./architecture.md#data-model).)

---

## Part 1 — Logs

### The dev server terminal (your main log)
When you run `bin/dev` (or `npm run dev`), the terminal is your primary log. Next
prints a line for **every request it serves**, e.g.:

```
 GET / 200 in 34ms
 POST /api/inbox/create 200 in 12ms
 POST /hook/in_4f9c2a 200 in 8ms
```

Anything you `console.log`/`console.error` inside a Route Handler shows up here
too. For example the catcher logs failures as `[catcher] capture failed: …`
([app/hook/[...slug]/route.ts](../app/hook/%5B...slug%5D/route.ts)).

> Tip: add a temporary `console.log("[catcher]", request.method, inboxId)` in the
> catcher to watch captures in real time while you test.

### The browser console (client logs)
Open the dashboard, then open DevTools (**Cmd+Option+I** on macOS) → **Console**
for client-side logs, and the **Network** tab to watch the polling: you'll see a
`requests` call fire every ~2 seconds. Click one to see its JSON response — this
is exactly what the UI renders.

### Docker app logs (only if you run the app in a container)
`bin/dev` runs the Next.js server on your host, so its logs are in your terminal.
If instead you run the whole stack in Docker (`docker compose up app`), read the
container logs:

```bash
export DOCKER_CONTEXT=colima-webhook   # target our dedicated Colima
docker compose logs -f app             # -f = follow (live tail)
docker compose logs -f srh             # the Redis REST proxy
docker compose logs -f redis
```

### Production logs (Vercel)
On Vercel, each Route Handler runs as a serverless function. View logs in the
**Vercel dashboard → your project → Deployments → (a deployment) → Functions /
Logs**, or with the CLI: `vercel logs <deployment-url>`.

---

## Part 2 — Inspecting the data (Redis)

> All `docker compose` commands below target the dedicated Colima. Either export
> the context once per shell, or know that `bin/setup`/`bin/dev` already made it
> active:
> ```bash
> export DOCKER_CONTEXT=colima-webhook
> ```

### Option A — `redis-cli` inside the container (easiest)

Open an interactive Redis shell:

```bash
docker compose exec redis redis-cli
```

Then run commands (replace `<id>` with a real inbox id like `in_4f9c2a`):

```text
KEYS inbox:*              # list every inbox currently stored
TYPE inbox:<id>           # -> "list"
LLEN inbox:<id>           # how many requests captured (max 100)
TTL  inbox:<id>           # seconds until auto-expiry (~86400 = 24h)
LRANGE inbox:<id> 0 -1    # ALL captured requests (each is a JSON string)
LINDEX inbox:<id> 0       # just the newest request
DEL  inbox:<id>           # wipe this inbox (same as "Clear all")
```

Or run a single command without entering the shell:

```bash
docker compose exec redis redis-cli LRANGE inbox:<id> 0 -1
```

**Translation from SQL, if that's your background:**

| You'd think (SQL) | Here (Redis) |
|---|---|
| `SELECT * FROM requests WHERE inbox='<id>'` | `LRANGE inbox:<id> 0 -1` |
| `SELECT COUNT(*) …` | `LLEN inbox:<id>` |
| newest row | `LINDEX inbox:<id> 0` (we prepend with `LPUSH`) |
| `DELETE FROM …` | `DEL inbox:<id>` |
| list of tables | `KEYS *` |

Each `LRANGE` element is a JSON string. To pretty-print it:

```bash
docker compose exec redis redis-cli LINDEX inbox:<id> 0 | python3 -m json.tool
```

### Option B — watch Redis live

See every command the app sends to Redis, as it happens — great for confirming a
capture actually wrote:

```bash
docker compose exec redis redis-cli MONITOR
```

Now fire a webhook (below) and watch the `LPUSH` / `LTRIM` / `EXPIRE` scroll by.

### Option C — through the SRH REST proxy (how the app talks to Redis)

The app never speaks raw Redis locally; it speaks Upstash's REST protocol to the
SRH proxy on `localhost:8079`. You can hit it the same way the app does — a POST
whose body is the Redis command as a JSON array:

```bash
TOKEN=hookview_dev_token   # from .env.local

# ping
curl -s -X POST http://localhost:8079 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '["PING"]'

# all requests for an inbox
curl -s -X POST http://localhost:8079 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '["LRANGE","inbox:<id>","0","-1"]'
```

### Option D — production (Upstash console)

On Vercel the data lives in your Upstash Redis database. Go to
[console.upstash.com](https://console.upstash.com) → your database → the **Data
Browser** (point-and-click) or the **CLI** tab (run `LRANGE inbox:<id> 0 -1`,
`TTL …`, etc. against the cloud DB).

---

## End-to-end: make data appear, then find it

1. Start things: `bin/dev` (note the port it prints, e.g. 3000).
2. Create an inbox and grab its id:
   ```bash
   ID=$(curl -s -X POST http://localhost:3000/api/inbox/create | sed -E 's/.*"id":"([^"]+)".*/\1/')
   echo "$ID"
   ```
3. Open `http://localhost:3000/inbox/$ID` in the browser (watch it live).
4. Fire a webhook at it:
   ```bash
   curl -X POST "http://localhost:3000/hook/$ID" \
     -H 'Content-Type: application/json' \
     -d '{"type":"charge.succeeded","amount":4900}'
   ```
5. Where it shows up:
   - **UI:** the request appears in the dashboard within ~2s (the primary view).
   - **Terminal:** a `POST /hook/$ID 200` line.
   - **Browser Network tab:** the next `requests` poll returns it.
   - **Redis:** `docker compose exec redis redis-cli LRANGE inbox:$ID 0 -1`.

## Common gotchas

- **"It works in the UI but `docker compose` says no such service / wrong data."**
  You're probably pointed at the wrong Docker daemon. Run
  `export DOCKER_CONTEXT=colima-webhook` (see [README](../README.md)).
- **Nothing in the terminal when I click buttons.** Button/polling code is
  client-side — look in the **browser** console, not the terminal.
- **The key disappeared.** Inboxes expire after 24h of inactivity (`TTL` shows
  the countdown), and the list only keeps the latest 100 requests (`LTRIM`).
- **Port 3000 was busy.** `bin/dev` auto-bumps to the next free port — use the
  port it actually prints.
