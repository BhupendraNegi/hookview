# CLAUDE.md
**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project: HookView

A disposable webhook capture & inspection tool. Users mint a throwaway URL, point a
service's webhooks at it, and watch requests land live. Captures auto-expire after 24h.

**Stack:** Next.js (App Router, TypeScript) · Upstash Redis (`@upstash/redis`) · Tailwind CSS ·
2s polling. One codebase runs on local Docker, self-hosted Docker, and Vercel — only the two
`UPSTASH_REDIS_REST_*` env vars differ.

### Local development

```bash
bin/setup     # once: starts the dedicated Colima profile, installs deps,
              #       creates .env.local, brings up Redis + SRH
bin/dev       # daily: starts the dev server; Ctrl-C tears down server + containers
```

- Runs in a **dedicated Colima profile `webhook`** (Docker context `colima-webhook`,
  pinned via `DOCKER_CONTEXT`) — never starts or touches the default Colima.
- `@upstash/redis` only speaks Upstash's REST protocol, so locally **SRH**
  (`hiett/serverless-redis-http`) proxies that REST API onto a plain Redis container.
  `.env.local` points `UPSTASH_REDIS_REST_URL` at `http://localhost:8079`.
- `bin/dev` defaults to port 3000 and **auto-bumps to the next free port** if it's taken.
- Fully stop the instance: `colima stop -p webhook`.

### Verify changes

```bash
npm run build        # must pass (typecheck + lint) — Vercel readiness gate
docker compose build # the standalone image must build (set DOCKER_CONTEXT=colima-webhook)
```

Catcher smoke test (with the dev server running on $PORT):
```bash
ID=$(curl -s -X POST http://localhost:$PORT/api/inbox/create | sed -E 's/.*"id":"([^"]+)".*/\1/')
curl -X POST "http://localhost:$PORT/hook/$ID" -H 'Content-Type: application/json' -d '{"type":"x"}'
curl -X POST "http://localhost:$PORT/hook/$ID" -H 'Content-Type: application/json' -d '{bad json'  # must still 200
```
Inspect Redis: `docker compose exec redis redis-cli TTL inbox:<id>` (~86400) / `LLEN` (≤100).

### Deploy to Vercel

Create an Upstash Redis DB, set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in the
Vercel project, push. No Docker on Vercel.

### Architecture notes

- **The catcher** ([app/hook/[...slug]/route.ts](app/hook/%5B...slug%5D/route.ts)) is the
  critical/fiddly part. It accepts **any** method/content-type/body, reads the **raw body
  first**, never validates or rejects, and **always returns 200**. Catch-all so subpaths are
  captured too. Don't add validation here.
- **Redis client is lazy** ([lib/redis.ts](lib/redis.ts)) — built on first use, not at module
  load, so `next build` doesn't require env vars at build time. Keep it that way.
- **`source`/`preview`** are derived at capture time (UI-only) in
  [lib/inbox.ts](lib/inbox.ts); everything else is wire data stored verbatim.
- Storage: `LPUSH` → `LTRIM 0 99` (cap 100) → `EXPIRE 86400` (24h) on key `inbox:{id}`.
- Design tokens live in [tailwind.config.ts](tailwind.config.ts) — reference semantic names,
  don't scatter raw hex.

### Conventions

- Commits: do **not** add a Claude co-author trailer.
- v1 is intentionally minimal — no accounts/auth, replay, custom responses, search, or
  multiple saved inboxes. Don't add these without being asked.
