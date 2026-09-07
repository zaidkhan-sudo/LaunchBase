# LaunchBase — Complete Backend Architecture & Data Flow

> Generated from the actual codebase as of Day 15. Every file, every flow, every edge case.

---

## 1. System Overview

LaunchBase runs as **two separate OS processes** plus external infrastructure:

| Process | Entry Point | Role |
|---|---|---|
| **API Server** | `server.js` → `app.js` | REST API, auth, Socket.IO, Redis subscriber |
| **Build Worker** | `buildWorker.js` | Queue consumer, git clone, Docker build, ECR push, ECS/ALB deploy |

They share **MongoDB** (persistent state) and **Redis** (job queue + real-time pub/sub).

### External Dependencies

| Service | Purpose |
|---|---|
| **MongoDB** | Users, Projects, Deployments, Sessions, OTPs |
| **Redis** | `build-queue` (LPUSH/BRPOP) + `deployment:events` pub/sub channel |
| **Docker Engine** | Local image builds via `docker build` CLI |
| **AWS ECR** | Container image registry |
| **AWS ECS Fargate** | Serverless container runtime |
| **AWS ALB** | Shared load balancer with per-project subdomain routing |
| **GitHub** | Webhook push events for CI/CD |
| **Gmail SMTP** | Email verification OTPs via OAuth2 |

---

## 2. API Server Architecture

### 2.1 Express App (`app.js`)

Middleware stack (order matters):
1. `cors()` — `origin: FRONTEND_URL`, `credentials: true` (for httpOnly refresh cookie)
2. `express.json()` — with `verify` hook capturing `req.rawBody` for webhook HMAC
3. `morgan('dev')` — HTTP request logging
4. `cookieParser()` — parses refresh token cookie

### 2.2 Route Map

| Route File | Base Path | Endpoints |
|---|---|---|
| `auth.routes.js` | `/api/auth` | `POST /register`, `POST /login`, `POST /logout`, `POST /refresh`, `GET /me`, `POST /verify-email`, `POST /resend-otp` |
| `project.routes.js` | `/api/project` | `GET /` (list), `POST /` (create), `GET /:id`, `DELETE /:id`, `GET /:id/deployments`, `POST /:id/redeploy` |
| `webhook.routes.js` | `/api/webhook` | `POST /github` |
| `deployment.routes.js` | `/api/deployment` | `GET /:id` (with full logs) |

### 2.3 Auth System (`auth.controller.js`)

- **Registration**: bcrypt hash → create User → generate OTP → send email → return access token
- **Email Verification**: 6-digit OTP, stored in `otp` collection with TTL
- **Login**: validate credentials → access token (JWT, short-lived) + refresh token (httpOnly cookie)
- **Token Refresh**: reads httpOnly cookie → verifies → issues new access token
- **Session Model**: tracks refresh tokens for revocation
- Refresh cookie options: `secure` only in production (Safari rejects over localhost)

### 2.4 Socket.IO Server (`sockets/index.js`)

- Mounted on the same HTTP server as Express
- **Auth middleware**: verifies JWT from `socket.handshake.auth.token`
- **Room model**: `project:<id>` — one room per project
- **Ownership check**: `subscribe:project` verifies `project.owner === socket.userId` before joining
- **Redis bridge**: a duplicated ioredis connection subscribes to `deployment:events` and relays to Socket.IO rooms

---

## 3. Data Models

### 3.1 User (`user.model.js`)
```
{ name, email, password (bcrypt), isVerified, createdAt, updatedAt }
```

### 3.2 Project (`project.js`)
```
{ name (unique, lowercase, [a-z0-9-]),
  owner (ref: User),
  repoUrl, branch,
  webhookSecret (crypto.randomBytes),
  status: IDLE | QUEUED | BUILDING | DEPLOYING | READY | FAILED,
  ecrImageUri, ecsServiceArn,
  albTargetGroupArn, albListenerRuleArn,
  liveUrl }
```
- `name` doubles as the DNS label for subdomain routing
- ALB ARN fields enable ordered teardown on delete

### 3.3 Deployment (`deployment.model.js`)
```
{ project (ref), owner (denormalized),
  status, trigger: MANUAL | WEBHOOK,
  commitHash, commitMessage, author,
  steps: [ { name, status, startedAt, finishedAt } ],
  logs: [ { ts, line, stream } ],   // capped at 2000 lines via $slice
  ecrImageUri, taskArn, liveUrl, errorMessage,
  startedAt, finishedAt }
```
- Steps: `CLONE → DOCKERFILE → BUILD → PUSH → DEPLOY`
- Each step has its own timer for per-stage duration display
- Logs are batched (1s / 50 lines) to avoid per-line DB writes

---

## 4. Build Pipeline (Worker)

### 4.1 Queue Mechanics

```
API Server                    Redis                     Build Worker
    │                           │                           │
    ├── LPUSH build-queue ────► │                           │
    │   (JSON: project_id,      │                           │
    │    deploymentId,           │ ◄── BRPOP build-queue ───┤
    │    repoUrl, branch)        │      (blocks until job)  │
```

### 4.2 Build Steps (processBuildJob)

| Step | Service | What Happens |
|---|---|---|
| **CLONE** | `simple-git` | `git clone --branch <branch> --depth 1` to `/workspace/<project_id>` |
| **DOCKERFILE** | `docker.service.js` | Detect runtime (Node/Python/Go via package.json/requirements.txt/go.mod), auto-generate Dockerfile if none exists |
| **BUILD** | `docker.service.js` | `docker build -t launchbase-<id>:latest .` — stdout/stderr streamed to logger |
| **PUSH** | `ecr.service.js` | Ensure ECR repo exists → `docker tag` → `docker push` to `<account>.dkr.ecr.<region>.amazonaws.com/launchbase-<id>:latest` |
| **DEPLOY** | `ecs.service.js` + `alb.service.js` | Register task definition → branch on `ALB_ENABLED` (see §5) |

### 4.3 Watchdog

- `cleanStaleBuilds()` runs on startup and every 15 minutes
- Any Project or Deployment stuck in `BUILDING`/`DEPLOYING` for >15 min → force `FAILED`
- Prevents zombie builds from a crashed worker

---

## 5. AWS Deployment — Two Paths

### 5.1 Without ALB (`ALB_ENABLED = false`)

```
registerECSTaskDefinition() → runECSTask() → READY, liveUrl = null
```
- One-shot Fargate task with `assignPublicIp: ENABLED`
- Random public IP, no restart on crash, no stable URL
- UI shows "URL pending"

### 5.2 With ALB (`ALB_ENABLED = true`)

```
registerECSTaskDefinition()
  → ensureTargetGroup()        // IP-type, port 8080, health: 15s/2 checks
  → ensureListenerRule()       // Host header match: <name>.<domain>
  → ensureECSService()         // CreateService or UpdateService (forceNewDeployment)
  → save ARNs to Project       // BEFORE health wait (for cleanup on timeout)
  → waitForRoutableService()   // Poll every 10s, up to 3 min
      → READY + liveUrl = http://<name>.<domain>
```

**Key ALB details:**
- Target group name: `lb-<name>-<8-hex-of-sha1(id)>` (≤32 chars)
- Priority: `findFreePriority()` reuses gaps from deleted projects (10+)
- `deregistration_delay`: 5s (not AWS default 300s)
- Health check matcher: `200-399` (apps that 302 to /login pass)
- Circuit breaker enabled with rollback

**ECS Service settings:**
- `minimumHealthyPercent: 100`, `maximumPercent: 200` → zero-downtime rolling deploy
- `healthCheckGracePeriodSeconds: 60` → prevents false-positive kills during boot
- `forceNewDeployment: true` on update → forces re-pull of `:latest` tag

---

## 6. Real-Time Log Streaming

```
buildWorker.js                Redis Pub/Sub              API Server              Browser
     │                            │                          │                      │
     ├─ PUBLISH ─────────────────►│                          │                      │
     │  deployment:events         │──── message event ──────►│                      │
     │  { type: "log",            │                          ├─ io.to(room).emit() ►│
     │    projectId, deploymentId,│                          │  "deployment:event"   │
     │    line, stream, ts }      │                          │                      │
```

**Three event types on the `deployment:events` channel:**

| Type | Payload | Frontend Effect |
|---|---|---|
| `log` | `line`, `stream` (stdout/stderr/system), `ts` | Appends to terminal panel |
| `step` | `step` name, `status` | Updates the 5-stage stepper with elapsed timers |
| `status` | `status`, `liveUrl`, `errorMessage` | Badge update, query invalidation, link display |

**Design decisions:**
- ANSI escape codes stripped server-side (`log.service.js`) — no ANSI library needed in frontend
- Logs batched to Mongo (1s or 50 lines), but published to Redis immediately (per-line)
- On terminal status (READY/FAILED), `flush()` is called before `status()` publish — ensures a client that refetches on status change sees complete logs
- Refresh mid-build works: `GET /api/deployment/:id` seeds historical logs, then socket takes over

---

## 7. GitHub Webhook CI/CD

```
GitHub                         API Server                    Redis              Worker
  │                                │                           │                  │
  ├─ POST /api/webhook/github ────►│                           │                  │
  │  x-github-event: push         │                           │                  │
  │  x-hub-signature-256: sha256=…│                           │                  │
  │                                ├─ Find project by repoUrl │                  │
  │                                ├─ verifyGithubSignature()  │                  │
  │                                │   (HMAC SHA-256 on raw    │                  │
  │                                │    body buffer, not       │                  │
  │                                │    re-serialized JSON)    │                  │
  │                                ├─ createDeployment()       │                  │
  │                                │   trigger: WEBHOOK        │                  │
  │                                │   + commit metadata       │                  │
  │                                ├─ LPUSH ──────────────────►│                  │
  │                                │                           │─── BRPOP ───────►│
  │  ◄─── 200 OK ─────────────────┤                           │                  │
```

- Ping events return 200 immediately
- Non-push events are ignored with 200
- HMAC verified against raw buffer (`req.rawBody`), not re-stringified JSON
- Repo URL matched with and without `.git` suffix

---

## 8. Project Deletion & AWS Teardown

AWS mandates strict ordering — resources in use cannot be deleted:

```
1. deleteECSService(serviceName)     // force: true, desiredCount: 0
2. await 8 seconds                   // drain wait
3. deleteListenerRuleByArn(ruleArn)  // remove from ALB listener
4. deleteTargetGroupByArn(tgArn)     // now safe to delete
5. Project.deleteOne()               // remove from MongoDB
6. Deployment.deleteMany()           // cascade delete orphaned deployments
```

**Trade-offs:**
- AWS failures never block Mongo delete — warnings returned in response
- Read-then-delete (not `findOneAndDelete`) — ARNs needed for cleanup, and project must stay visible during 8s drain
- Projects with no ALB resources skip AWS entirely (0 calls, 0ms)

---

## 9. State Machine

```
                    ┌───────────────────────────────────────┐
                    │                                       │
                    ▼                                       │
  [*] ──► IDLE ──► QUEUED ──► BUILDING ──► DEPLOYING ──► READY
                    ▲              │            │           │
                    │              ▼            ▼           │
                    │           FAILED ◄────────┘           │
                    │              │                        │
                    └──────────────┴────────────────────────┘
                      (webhook push or manual redeploy)
```

- `DEPLOYING` only exists when `ALB_ENABLED` — between ECR push and health check pass
- 15-minute watchdog auto-fails stuck builds
- `redeploy` returns 409 if a build is already in-flight

---

## 10. Configuration & Feature Gate

**Required env vars:** `MONGO_URI`, `PORT`, `JWT_SECRET`, `GOOGLE_*` (4), `AWS_*` (7 core)

**ALB feature gate** (3 vars, all-or-nothing):
```
ALB_REQUIRED_KEYS = ["AWS_VPC_ID", "AWS_ALB_LISTENER_ARN", "PLATFORM_DOMAIN"]
ALB_ENABLED = all three present
```
- Fully off: silent, deploys work, `liveUrl` stays null
- Fully on: silent, subdomain routing active
- Half-configured: console warning (catches typos before they become opaque AWS errors)

---

## 11. File Map

```
backend/
├── server.js                          # HTTP server + Socket.IO init
├── src/
│   ├── app.js                         # Express app, middleware, routes
│   ├── config/
│   │   ├── config.js                  # env vars + ALB feature gate
│   │   ├── db.js                      # MongoDB connection
│   │   ├── redis.js                   # ioredis client
│   │   └── aws.js                     # AWS SDK clients (ECR, ECS, ELB)
│   ├── models/
│   │   ├── user.model.js              # User schema (bcrypt)
│   │   ├── project.js                 # Project schema (+ ALB ARN fields)
│   │   ├── deployment.model.js        # Deployment schema (steps, logs)
│   │   ├── session.model.js           # Refresh token sessions
│   │   └── otp.model.js              # Email verification OTPs
│   ├── controllers/
│   │   ├── auth.controller.js         # Register, login, refresh, verify
│   │   ├── project.controller.js      # CRUD + redeploy + teardown
│   │   ├── deployment.controller.js   # GET deployment with logs
│   │   └── webhook.controller.js      # GitHub webhook ingestion
│   ├── services/
│   │   ├── queue.service.js           # pushToBuildQueue / popFromBuildQueue
│   │   ├── docker.service.js          # Dockerfile gen + docker build
│   │   ├── ecr.service.js             # ECR repo create + docker push
│   │   ├── ecs.service.js             # Task def, RunTask, CreateService
│   │   ├── alb.service.js             # Target group, listener rule lifecycle
│   │   ├── log.service.js             # createLogger (Redis pub + Mongo batch)
│   │   ├── deployment.service.js      # createDeployment (shared by API+webhook)
│   │   ├── webhook.service.js         # HMAC verify + processGithubPush
│   │   └── email.service.js           # Gmail SMTP via OAuth2
│   ├── middlewares/
│   │   └── auth.middleware.js         # JWT verification middleware
│   ├── sockets/
│   │   └── index.js                   # Socket.IO init + Redis bridge
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── webhook.routes.js
│   │   └── deployment.routes.js
│   ├── utils/
│   └── workers/
│       └── buildWorker.js             # Queue consumer + build pipeline
```
