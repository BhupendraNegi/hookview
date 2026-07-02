# HookView

**See exactly what your webhooks are sending — in real time.**

HookView is a disposable webhook capture & inspection tool. Click once to get a
unique URL, paste it into any service's webhook settings (Stripe, GitHub,
Shopify, …), and watch requests land live in a dashboard where you can inspect
the method, headers, query params, and a pretty-printed JSON body.

- **No accounts, nothing to install.**
- Captures **auto-expire after 24h**; the list is capped at the **last 100**
  requests per inbox.
- The catcher accepts **any** HTTP method, content-type, and body — it never
  rejects anything and always returns `200`.

**Stack:** Next.js (App Router, TypeScript) · Upstash Redis (`@upstash/redis`) ·
Tailwind CSS · 2s polling. One codebase runs on local Docker, self-hosted Docker,
and Vercel — only the two env vars differ.

## Quick start (local)

```bash
bin/setup     # one-time: Colima profile, deps, .env.local, Redis + SRH
bin/dev       # start the dev server; Ctrl-C tears down server + containers
```

Then open the printed URL (defaults to http://localhost:3000; `bin/dev`
auto-bumps to the next free port if 3000 is taken). No cloud account needed —
local storage runs in Docker. See [docs/development.md](docs/development.md) for
the by-hand steps, the dedicated Colima profile, and self-hosting.

## Environment variables

| Var | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL (or the local SRH proxy URL) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token (or the local SRH shared token) |

See [`.env.example`](.env.example) for both the Docker and Vercel value sets.

## Deploy to Vercel

1. **Create an Upstash Redis database** at
   [console.upstash.com](https://console.upstash.com) and copy its **REST URL**
   and **REST token**.
2. Import this repo into Vercel.
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` under
   **Project → Settings → Environment Variables**.
4. Deploy. Your catcher URLs will be `https://<your-app>.vercel.app/hook/<id>`.

No Docker is involved on Vercel — it uses the real Upstash database directly.

## Documentation

| Doc | What's in it |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Stack, request lifecycle, data model, routes, file layout, key decisions |
| [docs/design.md](docs/design.md) | Product intent, screens, and the design system (tokens, type, motion) |
| [docs/development.md](docs/development.md) | Running locally by hand, the Colima profile, scripts, CI, self-hosting |
| [docs/debugging.md](docs/debugging.md) | Newcomer's guide: where logs go and how to inspect the Redis data |

## Out of scope (v1)

User accounts, auth, webhook replay, custom response codes/bodies,
search/filter, multiple saved inboxes per user.


# Live 

https://hookview.vercel.app/
