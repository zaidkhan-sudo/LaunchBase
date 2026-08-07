# 🚀 LaunchBase

> A scaled-down Vercel/Heroku clone — push code, and watch it get containerized, shipped to the cloud, and served on a live URL, automatically.

LaunchBase takes a GitHub repository and turns it into a running, publicly accessible application with zero manual server management. Push to your repo, and a webhook kicks off a fully automated pipeline: clone → containerize → push to a registry → deploy on serverless infrastructure → route live traffic to it — all tracked and reported back through a project dashboard.

---

## ✨ Features

- **Enterprise-Grade Authentication & Session Engine**:
  - **Dual-Token Architecture (Access + Refresh Token Rotation)** — Employs short-lived JWT access tokens alongside secure, database-backed refresh tokens that rotate on every renewal to neutralize token replay attacks.
  - **Multi-Device Session Tracking & Revocation** — Maintains granular session records in MongoDB (`session.model.js`), allowing users to revoke individual device sessions (`/logout`) or perform an instant global sign-out across all devices (`/logout-all`).
  - **Multi-Step Onboarding & Email OTP Verification** — Enforces identity verification via one-time passwords (`otp.model.js`) before account activation.
  - **Google OAuth 2.0 Integration** — Seamless one-click authentication.
- **Cryptographic Webhook Security** — Protects CI/CD build pipelines using HMAC SHA-256 signature verification (`x-hub-signature-256`) and constant-time buffer comparisons (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
- **Project Management** — Create, list, and delete deployment projects tied to a GitHub repo.
- **Asynchronous Build Pipeline** — API requests never block on long-running builds; a Redis-backed queue hands work off to dedicated background workers (`buildWorker.js`).
- **Automatic GitHub Integration** — A webhook listens for repo pushes and automatically triggers a new build/deploy cycle.
- **Dockerized Builds** — Every project is built into a Docker image on the fly, tagged, and versioned.
- **Cloud-Native Deployment** — Images are pushed to AWS ECR and run as serverless containers on ECS Fargate — no servers to provision or patch.
- **Live Status Tracking** — Deployment status (`PENDING`, `BUILDING`, `READY`, `FAILED`) is persisted in MongoDB and reflected in real time on the dashboard.
- **Custom Subdomain Routing** — An AWS Application Load Balancer routes traffic from `<project>.yourdomain.com` to the correct running container.
- **Dashboard UI** — A React (Vite) + Tailwind frontend showing project lists, deployment logs, and live status badges.

---

## 🏗️ Architecture

```
 Developer                GitHub                  LaunchBase API
     │                       │                            │
     │── git push ──────────►│                            │
     │                       │── webhook (POST) ─────────►│
     │                       │                            │
     │                                            ┌────────┴─────────┐
     │                                            │   Redis Queue    │
     │                                            │  (LPUSH / BRPOP) │
     │                                            └────────┬─────────┘
     │                                                     │
     │                                            ┌────────▼─────────┐
     │                                            │  Background      │
     │                                            │  Worker          │
     │                                            │  (buildWorker.js)│
     │                                            └────────┬─────────┘
     │                                                     │
     │                                    clone repo → docker build → docker tag
     │                                                     │
     │                                            ┌────────▼─────────┐
     │                                            │   AWS ECR        │
     │                                            │ (image registry) │
     │                                            └────────┬─────────┘
     │                                                     │
     │                                            ┌────────▼─────────┐
     │                                            │  AWS ECS Fargate │
     │                                            │ (runs container) │
     │                                            └────────┬─────────┘
     │                                                     │
     │                                            ┌────────▼─────────┐
     │◄────── live app @ project.yourdomain.com ──│    AWS ALB       │
     │                                            └───────────────────┘

     MongoDB tracks project + deployment status (READY / FAILED) throughout.
```

**Design principle:** the web server (API) stays thin and fast. All heavy lifting — cloning, building, pushing, deploying — happens asynchronously in background workers, decoupled from the request/response cycle via a Redis queue.

---

## 🔐 Enterprise-Grade Security & Authentication

LaunchBase implements production-ready, defense-in-depth security patterns rarely found in standard portfolio projects:

### 1. Dual-Token Rotation & Session Management
- **Short-Lived Access Tokens**: Authenticates day-to-day API requests with stateless JWTs.
- **Database-Backed Refresh Token Rotation**: Refresh tokens are tracked in MongoDB (`Session` collection). Each time `/api/auth/refresh` is called, the old refresh token is invalidated and a fresh pair is issued. If a compromised token is reused, the entire session chain can be detected and revoked immediately.
- **Multi-Device Governance**: Users can inspect active sessions and revoke compromised devices individually (`/api/auth/logout`) or call `/api/auth/logout-all` to instantly terminate access across all active endpoints.
- **OTP Email Verification**: Secure user onboarding via one-time password verification (`otp.model.js`).

### 2. Cryptographic Webhook Protection (`crypto.timingSafeEqual`)
To protect our container build pipeline from malicious spoofing or DDoS attempts:
- Every deployment project is assigned a unique 40-character hexadecimal `webhookSecret`.
- When GitHub delivers a `push` payload, `webhook.service.js` calculates an HMAC SHA-256 digest of the raw request body.
- Using `crypto.timingSafeEqual()`, the calculated digest is compared against GitHub's `x-hub-signature-256` header in **constant time**, eliminating timing side-channel vulnerabilities.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| API Server | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcrypt, Google OAuth 2.0 |
| Queue | Redis (LPUSH / BRPOP) |
| Background Worker | Node.js |
| Containerization | Docker (via Node.js child process / Docker SDK) |
| CI Trigger | GitHub Webhooks |
| Local Tunneling (dev) | ngrok |
| Cloud Provider | AWS |
| Container Registry | AWS ECR |
| Compute | AWS ECS Fargate |
| Networking | AWS Application Load Balancer (ALB) |
| Infra SDK | AWS SDK v3 |
| Frontend | React (Vite) + Tailwind CSS |

---

## 📁 Project Structure

```
LaunchBase/
├── src/
│   ├── config/            # DB, Redis, AWS client configuration
│   ├── controllers/       # Auth, Project, Webhook controllers
│   ├── models/            # User & Project (Mongoose schemas)
│   ├── routes/            # Express route definitions
│   ├── middleware/        # JWT auth middleware, error handling
│   ├── queue/             # Redis producer (LPUSH) logic
│   ├── workers/
│   │   └── buildWorker.js # Consumes queue, clones repo, builds & deploys
│   ├── services/
│   │   ├── docker.js      # docker build / docker tag helpers
│   │   ├── ecr.js         # Push image to ECR
│   │   └── ecs.js         # Spin up ECS Fargate task
│   └── app.js
├── frontend/               # React (Vite) + Tailwind dashboard
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Redis
- Docker
- An AWS account (IAM user with ECR + ECS + ALB permissions)
- ngrok (for local webhook testing)

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/LaunchBase.git
cd LaunchBase

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/LaunchBase

# Auth
JWT_SECRET=your_jwt_secret

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Redis
REDIS_URL=redis://localhost:6379

# GitHub
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
ECR_REPOSITORY_URI=your_ecr_repo_uri
ECS_CLUSTER_NAME=your_ecs_cluster
ECS_TASK_DEFINITION=your_task_definition
ALB_LISTENER_ARN=your_alb_listener_arn
```

### Running Locally

```bash
# Start the API server
npm run dev

# In a separate terminal, start the background worker
node src/workers/buildWorker.js

# Expose your webhook endpoint to the internet (for GitHub to reach it)
ngrok http 5000

# Start the frontend
cd frontend && npm run dev
```

Then register the ngrok HTTPS URL + `/api/webhook` as your GitHub repo's webhook endpoint.

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user & trigger OTP verification | No |
| POST | `/api/auth/verify-email` | Verify email address via OTP code | No |
| POST | `/api/auth/login` | Log in, receive Access + Refresh Token pair | No |
| GET | `/api/auth/me` | Fetch authenticated profile & session details | Yes (Access Token) |
| POST | `/api/auth/refresh` | Rotate tokens using valid Refresh Token & active session | No (Refresh Token) |
| POST | `/api/auth/logout` | Revoke current device session | Yes |
| POST | `/api/auth/logout-all` | Revoke all active sessions across all devices | Yes |
| GET | `/api/auth/google` | Start Google OAuth 2.0 login flow | No |
| GET | `/api/auth/google/callback` | Google OAuth callback, issues session tokens | No |
| POST | `/api/project/create` | Create a new deployment project | Yes |
| GET | `/api/project` | List the user's projects | Yes |
| GET | `/api/project/:id` | Get a single project's status | Yes |
| DELETE | `/api/project/:id` | Delete a project | Yes |
| POST | `/api/webhook/github` | GitHub push webhook (triggers build via Redis) | HMAC SHA-256 Verified |

---

## 🔄 How a Deployment Works

1. User connects a GitHub repo and creates a project via the dashboard.
2. A push to the repo fires a GitHub webhook to the API.
3. The API pushes a build job onto the Redis queue (`LPUSH`).
4. `buildWorker.js` picks up the job (`BRPOP`), clones the repo, and runs `docker build` + `docker tag`.
5. The built image is pushed to AWS ECR.
6. The worker calls the ECS Fargate API to spin up a new task from that image.
7. Project status in MongoDB is updated to `READY` or `FAILED` based on the deployment outcome.
8. The AWS ALB routes `<project-name>.yourdomain.com` to the running container.
9. The dashboard reflects the live status and URL in real time.

---

## 🗺️ Development Roadmap

This project was built as a focused 15-day sprint, broken into five phases:

- [x] **Phase 1 — Foundation & API:** Express server, MongoDB models, auth, project CRUD
- [x] **Phase 2 — Background Workers & Queue:** Redis queue, `buildWorker.js`, repo cloning
- [x] **Phase 3 — Docker & GitHub Automation:** Docker build/tag automation, webhook controller, ngrok tunneling
- [x] **Phase 4 — AWS Infrastructure & Deployment:** IAM setup, ECR push, ECS Fargate deployment, status tracking
- [ ] **Phase 5 — Networking & Frontend:** ALB subdomain routing, React (Vite) + Tailwind dashboard, final integration testing

**Current status:** Backend (Phases 1–4) is essentially complete. Remaining work is on ALB routing and the frontend dashboard.

---

## 🔮 Future Improvements

- **GitHub OAuth 2.0 login** (in addition to Google OAuth), enabling direct repo access without manual webhook setup
- Live build logs streamed to the frontend (via WebSockets or SSE)
- Environment variable management per project
- Multiple deployment environments (staging/production)
- Rollback to previous deployments
- Usage/cost dashboard per project
- Support for non-GitHub sources (GitLab, direct upload)

---

## 🤝 Contributing

This is currently a solo portfolio project, but suggestions and issues are welcome — feel free to open an issue or PR.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

Inspired by the developer experience of platforms like Vercel, Netlify, and Heroku — built from scratch to understand what happens under the hood.
