# Deploying HookView to Vercel

HookView is a server app (the catcher receives POSTs; the API routes talk to
Redis with a secret token), so it needs a Node host — **Vercel**, not a static
host like GitHub Pages. GitHub stays in the loop for source + CI; it just isn't
the host.

Only two env vars differ between environments: `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`.

## Step 0 — Pre-flight (local, ~2 min)

Confirm the readiness gates pass before you touch Vercel:

```bash
bin/lint        # ESLint + tsc
npm test        # Vitest suite
npm run build   # the same build Vercel runs
```

All three must be green. Also make sure `main` is pushed to GitHub
(`git status` clean, `git push`) — Vercel deploys from the remote, not your
working tree.

## Step 1 — Create the Upstash Redis database (~2 min)

1. Go to [console.upstash.com](https://console.upstash.com) → sign in (GitHub
   login works) → **Create Database**.
2. Name: `hookview-prod`. Region: pick **us-east-1 (N. Virginia)** — Vercel
   defaults its functions to `iad1` (same place), and keeping them colocated
   matters since the UI polls Redis every 2s.
3. Free tier is fine (500K commands/month; polling + captures fit comfortably
   for personal use).
4. On the database page, copy the **REST URL** (`https://….upstash.io`) and
   **REST TOKEN** — **not** the Redis/TCP connection string; `@upstash/redis`
   needs the REST pair.

## Step 2 — Import the repo into Vercel (~3 min)

1. Go to [vercel.com/new](https://vercel.com/new) → sign in with GitHub →
   import `BhupendraNegi/hookview`.
2. Vercel auto-detects Next.js. Leave build command, output directory, and
   install command at their defaults — no overrides needed.
3. **Before clicking Deploy**, expand **Environment Variables** and add both
   (names must match exactly):
   - `UPSTASH_REDIS_REST_URL` = the REST URL from Step 1
   - `UPSTASH_REDIS_REST_TOKEN` = the REST token

   Apply them to **Production** and **Preview** so PR previews work too.
4. Click **Deploy**.

## Step 3 — Smoke test the live deployment (~2 min)

Using your deployment URL (e.g. `https://hookview.vercel.app`):

```bash
BASE=https://<your-app>.vercel.app

ID=$(curl -s -X POST $BASE/api/inbox/create | sed -E 's/.*"id":"([^"]+)".*/\1/')
echo "inbox: $ID"

curl -X POST "$BASE/hook/$ID" -H 'Content-Type: application/json' -d '{"type":"smoke"}'
curl -X POST "$BASE/hook/$ID" -d '{bad json'                 # malformed — must still 200
curl -i -X POST "$BASE/hook/wp-login.php" -d 'x' | head -1   # junk id — 200, not stored
```

Then open `$BASE/inbox/$ID` in a browser — both real requests should be
visible (including the malformed one); the `wp-login.php` hit should **not**
appear. That exercises the full path: create → catcher → Redis → polling UI,
plus the id-shape guard.

## Step 4 — Confirm continuous deployment works

Push any trivial commit to `main` — Vercel deploys it automatically, and GitHub
Actions CI runs alongside. Open a test PR to see the preview-deployment comment
appear.

## Step 5 (optional) — Gate merges on CI

Vercel's Git integration deploys on push even if CI fails. If you want
protection, enable branch protection on `main` in GitHub (Settings → Branches →
require the `check` job to pass) and merge via PRs. For a personal v1 tool this
is skippable.

## Rollback

If a deploy misbehaves: Vercel dashboard → project → **Deployments** → pick the
last good one → **Promote to Production**. Instant, no rebuild.

## Cost guardrail

The Vercel Hobby plan and Upstash free tier cover this app with no card. To cap
worst-case abuse, keep the Upstash DB on the free tier (or set a spend cap) so
the failure mode is a paused database, not a bill.
