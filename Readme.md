Here is the complete roadmap for 15-day sprint. Breaking it down into distinct phases will keep you focused and prevent you from getting overwhelmed by the DevOps pieces later on.
Here is exactly how your Vercel/Heroku clone will come to life:
### Phase 1: Foundation & API (Days 1–3) 
**Goal:** Build the core backend infrastructure and user management.
* **Day 1:** Express server setup, MongoDB connection, User & Project schemas.
* **Day 2:** User Authentication (Signup, Login, JWT generation, bcrypt).
* **Day 3:** Project CRUD operations (Create a project, fetch user's projects, delete a project).
### Phase 2: Background Workers & Message Queue (Days 4–5)
**Goal:** Decouple the web server from the heavy build process so the API doesn't crash.
* **Day 4:** Set up Redis and create the task queue (using LPUSH and BRPOP).
* **Day 5:** Build the Node.js background worker (buildWorker.js) that listens for new tasks and clones the GitHub repository locally.
### Phase 3: Docker & GitHub Automation (Days 6–8)
**Goal:** Containerize the user's code and connect it to their GitHub actions.
* **Day 6:** Programmatically run Docker commands via Node.js (docker build and docker tag).
* **Day 7:** Set up the Webhook controller to listen for GitHub POST payloads.
* **Day 8:** Connect your local environment to the internet using **ngrok** so GitHub can actually reach your Webhook to trigger the process.
### Phase 4: AWS Infrastructure & Deployment (Days 9–12)
**Goal:** Push the Docker image to the cloud and run it serverlessly. *(This is where the JIT learning kicks in!)*
* **Day 9:** Set up AWS IAM users/roles and initialize the AWS SDK v3 in your backend.
* **Day 10:** ECR Integration: Programmatically push the built Docker image to your AWS Elastic Container Registry.
* **Day 11:** ECS Fargate Integration: Write the SDK logic to spin up a new serverless task using that Docker image.
* **Day 12:** Update the MongoDB project status to READY or FAILED based on the ECS response.
### Phase 5: Networking & Frontend (Days 13–15)
**Goal:** Route internet traffic to the container and give the user a dashboard.
* **Day 13:** AWS ALB (Application Load Balancer): Configure routing so a specific subdomain (e.g., user-app.yourdomain.com) points to the correct ECS container.
* **Day 14:** Generate the React (Vite) + Tailwind frontend using AI to display the user dashboard, project list, and live status badges.
* **Day 15:** Final integration testing, bug squashing, and celebrating a massive portfolio piece!

---

## Status

| Phase | State |
|---|---|
| 1 — Foundation & API | Done |
| 2 — Workers & Queue | Done |
| 3 — Docker & Webhooks | Done |
| 4 — AWS ECR + Fargate | Done |
| 5 — Frontend + live logs | Done |
| 5 — Day 13: AWS ALB | Code done, tested against stubs — **not provisioned yet** |

Day 13 gives every project a real subdomain (`myapp.yourdomain.xyz`) via a shared
Application Load Balancer, and moves containers from one-shot `RunTask` to
supervised ECS **Services** — so they restart on crash and redeploy with zero
downtime. See [`DAY13.md`](./DAY13.md) for what changed and why, and
[`ALB-SETUP.md`](./ALB-SETUP.md) for the AWS console steps.

The feature is gated on three env vars (`AWS_VPC_ID`, `AWS_ALB_LISTENER_ARN`,
`PLATFORM_DOMAIN`). Until they are set, `ALB_ENABLED` is `false`, deploys use the
original `RunTask` path, and `liveUrl` stays `null` — an ALB bills ~$16/month
whether used or not, so running without one is a supported path, not a broken
one.

---

## Running it locally

Requires MongoDB and Redis running, plus Docker for builds.

```bash
# 1. Backend API + Socket.IO server
cd backend && npm install && npm run dev          # :8000

# 2. Build worker — SEPARATE process, must be running or builds never start
cd backend && npm run worker

# 3. Frontend
cd frontend && npm install && npm run dev         # :5173
```

`backend/.env` needs the existing keys plus an optional `FRONTEND_URL`
(defaults to `http://localhost:5173`). Copy `frontend/.env.example` to
`frontend/.env` if the API is not on `localhost:8000`.

---

## How live build logs work

The worker is a **separate OS process** from the API server, so it cannot reach
Socket.IO clients directly. Redis Pub/Sub bridges the gap:

```
buildWorker ──PUBLISH deployment:events──▶ Redis
                                            │
                                       SUBSCRIBE (duplicated ioredis connection)
                                            ▼
                        API server ──io.to('project:<id>')──▶ browser
```

Three event types are published, all carrying `projectId` + `deploymentId`:

| Event | Payload | Drives |
|---|---|---|
| `log` | `line`, `stream`, `ts` | the terminal panel |
| `step` | `step`, `status` | the five-stage stepper |
| `status` | `status`, `liveUrl`, `errorMessage` | badges, query invalidation |

Key design points:

- **Realtime and durability are separate.** Every line publishes to Redis
  immediately, but Mongo writes are batched (1s / 50 lines) with
  `$slice: -2000`. Per-line writes would be hundreds of round-trips per build.
- **ANSI is stripped server-side** (`log.service.js`), so the DB stays clean and
  the frontend needs no ANSI library.
- **A refresh mid-build works.** The page seeds from
  `GET /api/deployment/:id` (logs included) before the socket takes over, so
  history renders for finished builds too.
- **Rooms are ownership-checked.** `subscribe:project` verifies the project
  belongs to the socket's user before joining — otherwise any logged-in user
  could read anyone's build logs.

### A `Deployment` is the real entity

`Project` only holds current state. Each build creates a `Deployment` with its
own `steps[]` (CLONE → DOCKERFILE → BUILD → PUSH → DEPLOY), captured `logs[]`,
commit metadata, and timings. That is what makes history, re-deploy, and
per-commit detail possible.

### New endpoints

| Route | Purpose |
|---|---|
| `GET /api/project/:id/deployments` | history (logs excluded) |
| `GET /api/deployment/:id` | one deployment with full logs — replay on load |
| `POST /api/project/:id/redeploy` | rebuild without pushing to GitHub |

`redeploy` returns **409** if a build is already in flight — the worker handles
one job at a time and would otherwise race on the same workspace directory.

---

## Frontend

Vite + React (plain JSX) · Tailwind v4 (`@theme` tokens, no config file) ·
TanStack Query · socket.io-client · Zustand · sonner · lucide-react

Vercel-style monochrome: near-black surfaces, 1px borders instead of shadows,
white-on-black primary buttons, Geist + Geist Mono. All colors are tokens in
`src/index.css` — nothing is hardcoded.

UI primitives under `components/ui/` are hand-written in shadcn's idiom
(`cva` + `cn`) rather than pulled via the shadcn CLI, so there is no Radix
dependency and no `components.json` to keep in sync.

Two details worth keeping:

- **The stepper**, not the log dump, is what makes it feel like a platform.
  Steps light up live with counting-up elapsed timers.
- **Auto-scroll disengages the instant you scroll up**, with a "jump to bottom"
  pill. Without that, reading anything mid-build is impossible.

---

## Fixes made along the way

- `cors()` had no options, so the httpOnly refresh cookie could never be sent
  cross-origin. Now `{ origin: FRONTEND_URL, credentials: true }`, registered
  before body parsing so preflight short-circuits.
- Webhook HMAC verified `JSON.stringify(req.body)`. GitHub signs the raw bytes;
  re-serializing can reorder keys and fail a legitimate signature. Now verified
  against a raw buffer captured by the `express.json` verify hook.
- `webhook.service.js` matched `{$in: [url, url]}` — the same string twice. The
  intent was `url` and `url.git`, so repos stored with a `.git` suffix never
  matched and webhooks silently rejected.
- `handleVerifyEmail` created an access token but never returned it, so a
  just-verified user was bounced to the login screen.
- Auth errors returned 500/400 for expired or revoked tokens; these are now 401
  so the client can distinguish "log back in" from "server broke".
- `/me` returned `user` as a bare string while `/login` returned an object.
  Normalized.
- Refresh-cookie options were duplicated three times with `secure: true`, which
  Safari rejects over `http://localhost`. Extracted to
  `refreshCookieOptions()`, now production-gated.
- Deleted `models/user.js`, a byte-for-byte duplicate of `user.model.js` that
  also called `mongoose.model('User')` — an `OverwriteModelError` waiting to
  happen.
- The stale-build watchdog only reset `Project.status`, leaving orphaned
  deployments spinning forever in the UI. It now fails both.
