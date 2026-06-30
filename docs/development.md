# Development & local operations

The hands-on details of running HookView locally and self-hosting it. For the
quick start, see the [README](../README.md); for inspecting logs and data, see
[debugging.md](./debugging.md).

## Why SRH locally

`@upstash/redis` only speaks Upstash's REST protocol. Locally we run
[`serverless-redis-http` (SRH)](https://github.com/hiett/serverless-redis-http) —
a tiny proxy that exposes that REST API on top of a plain Redis container — so
the **app code is identical to production**; only the env vars change.

## Dedicated Colima instance

`bin/setup` and `bin/dev` run in their own Colima profile named **`webhook`**
(Docker context `colima-webhook`) so they never start or touch your default
Colima. When running `docker` commands by hand, pin them to it the same way:

```bash
export DOCKER_CONTEXT=colima-webhook
```

Fully stop the instance when you're done: `colima stop -p webhook`.

## Running by hand

The `bin/` scripts are the easy path; these are the equivalent manual steps.

### Option A — everything in Docker

```bash
colima start -p webhook              # dedicated Docker daemon
export DOCKER_CONTEXT=colima-webhook # pin docker/compose to it
docker compose up --build            # starts redis + srh + the app
open http://localhost:3000
```

### Option B — app on the host, Redis in Docker

Run just the backing services in containers and the Next.js dev server natively
(faster hot reload):

```bash
colima start -p webhook
export DOCKER_CONTEXT=colima-webhook
docker compose up -d redis srh   # SRH is published on localhost:8079
cp .env.example .env.local        # already points at http://localhost:8079
npm install
npm run dev
open http://localhost:3000
```

> Port 3000 already taken? Run `PORT=3939 npm run dev` (or `bin/dev` auto-bumps).

## Scripts

| Command | Description |
|---|---|
| `bin/setup` | One-time: Colima profile, deps, `.env.local`, Redis + SRH |
| `bin/dev` | Start the dev server; tears down server + containers on exit |
| `bin/lint` | ESLint + `tsc --noEmit` (also run in CI) |
| `npm test` | Run the Vitest suite (also run in CI) |
| `npm run dev` | Start the dev server (without the container/teardown wrapper) |
| `npm run build` | Production build (standalone output for Docker) |
| `npm start` | Run the production build |
| `npm run lint` | ESLint only |

## Quick smoke test

```bash
# create an inbox
ID=$(curl -s -X POST http://localhost:3000/api/inbox/create | sed -E 's/.*"id":"([^"]+)".*/\1/')

# fire a webhook at it (open http://localhost:3000/inbox/$ID to watch it land)
curl -X POST "http://localhost:3000/hook/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"type":"charge.succeeded","amount":4900,"currency":"usd"}'
```

See [debugging.md](./debugging.md) for the full end-to-end walkthrough and how to
inspect the stored data.

## Continuous integration

[.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on every push to
`main` and every PR: `npm ci` → `bin/lint` → `npm test` → `npm run build` on
Node 22. No Docker or Redis is needed in CI (the tests mock the Redis-touching
helpers, and the build doesn't require env vars — the Redis client is
constructed lazily; see
[architecture.md](./architecture.md#key-implementation-decisions)).

## Tests

[Vitest](https://vitest.dev) unit tests live in [tests/](../tests). They cover
the highest-value logic without a live Redis or a browser:

- `tests/lib.test.ts` — the pure helpers: method colors, relative/exact time,
  JSON highlighting + HTML-escaping, inbox-id format, and the
  `deriveSource`/`derivePreview` heuristics.
- `tests/routes.test.ts` — the Route Handlers. The Redis-touching helpers
  (`captureRequest`/`getRequests`/`clearRequests`) are mocked so the tests
  exercise the routes' own logic — especially the **catcher contract**: any
  method, raw body stored verbatim, malformed bodies never rejected, and an
  always-`200` response even when storage throws.

Run them with `npm test` (or `npx vitest` to watch).

## Self-host with Docker

`docker-compose.yml` is a complete self-hosted stack (`app` + `redis` + `srh`).
Point a reverse proxy / domain at the `app` service on port 3000. For a managed
datastore instead, drop the `redis`/`srh` services and set the two
`UPSTASH_REDIS_REST_*` vars on the `app` service to a real Upstash DB.
