# Implementation Plan — Admin-Only Deployment Restriction (AWS Cost Protection) & Public Demo Showcase

Protect personal AWS infrastructure (ECS Fargate compute, ECR storage, and ALB listener rules) by restricting build, deploy, and infrastructure teardown triggers to authorized administrator email(s), while enabling an interactive **Demo Showcase** mode so recruiters and visitors can explore pre-deployed projects, view live log replays, and inspect system architecture without incurring cloud costs.

---

## 1. Context & Motivation

* **Current Architecture:** Any authenticated user can call `POST /api/project` or `POST /api/project/:project_id/redeploy`. Each call invokes `createDeployment({ trigger: "MANUAL" })`, pushing a job to Redis. The worker then spins up Docker, pushes images to AWS ECR, and creates ECS Fargate tasks/services behind the ALB. Furthermore, `DELETE /api/project/:project_id` triggers live AWS infrastructure teardown (ECS service force-stop, ALB rule and target group deletion).
* **The Risk:** Public visitors, bots, or spam could rapidly consume AWS credits, spin up multiple concurrent Fargate tasks ($0.0123/hr each), consume ECR storage, or hit ALB quota limits (max 100 listener rules).
* **The Problem with Raw Restrictions:** If we simply block non-admins from deploying while keeping queries strictly scoped to `owner: req.user._id`, new visitors and recruiters see an empty dashboard with `0 projects` and a disabled "Deploy" button — giving them a dead-end experience in under 10 seconds.
* **The Solution:** 
  1. **Strict Mutation Lock:** Enforce Role-Based Access Control (RBAC) on all mutating endpoints (`POST /project`, `POST /redeploy`, `DELETE /project`). Only your email (`ADMIN_EMAIL`) can trigger AWS compute or networking changes.
  2. **Demo Showcase (`isDemo: true`):** Allow designated admin projects to be flagged as `isDemo: true`. Non-admin visitors can read these projects, see the 5-step stepper, replay the full 2,000 lines of streaming logs, and inspect commit metadata — 100% free of charge and zero AWS risk.

---

## 2. Architecture & Security Analysis

### Where AWS Resources are Mutated (Admin Only):
1. `POST /api/project` (`handleCreateProject`) $\to$ Creates project and enqueues initial build.
2. `POST /api/project/:project_id/redeploy` (`handleRedeployProject`) $\to$ Enqueues redeploy build.
3. `DELETE /api/project/:project_id` (`handleDeleteProject`) $\to$ Triggers AWS teardown (`releaseProjectInfrastructure`), deleting ECS services, listener rules, and target groups.
4. `POST /api/webhook/github` (`processGithubPush`) $\to$ Triggers build on push. **Note:** Webhooks require matching a `project.webhookSecret`. Since non-admins cannot create projects, they cannot configure webhooks for their repositories. Existing admin projects remain protected because the webhook secret is only known to the admin and GitHub.

### What Remains Public / Guest-Accessible (Free Reads):
* Authentication (`/register`, `/login`, `/verify-email`, `/me`, `/refresh`).
* Reading user-owned projects **plus** any project marked `isDemo: true` (`GET /api/project`, `GET /api/project/:project_id`, `GET /api/deployment/:deployment_id`).
* Socket.IO streaming of build logs and deployment events for owned or demo projects.

### Token Rotation vs. User State Lifecycle:
* Token refresh (`POST /api/auth/refresh`) rotates the refresh token and returns only `{ accessToken }`. It deliberately does not re-query the user document or return a `user` object.
* The frontend stores `user` (including `isAdmin`) in persisted Zustand state (`useAuthStore`).
* Therefore, `isAdmin` status is established during **login**, **registration**, **email verification**, or direct **`/me`** profile checks. It is **not** refreshed during automatic token rotation, keeping token refresh lightweight. If `ADMIN_EMAIL` is modified in `.env`, the user's role updates on their next login or `/me` call.

---

## 3. Step-by-Step Proposed Changes

### Phase A: Backend Configuration & Environment Variables

#### [MODIFY] `backend/src/config/config.js`
* Add `ADMIN_EMAILS` to the parsed config:
  ```javascript
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  ```
* Support single email (`ADMIN_EMAIL=zaid@...`) or multiple comma-separated emails.
* Log a startup diagnostic:
  ```
  [Config] Admin deploy restriction active: [zaid@...]
  ```

#### [MODIFY] `backend/.env` & `backend/.env.example`
* Add `ADMIN_EMAIL=your_email@gmail.com` to `.env` (using the email you use to sign in).

---

### Phase B: Admin Guard Middleware

#### [NEW] `backend/src/middlewares/admin.middleware.js`
* Create a dedicated, reusable middleware `requireAdminDeployer`:
  ```javascript
  import config from "../config/config.js"

  export function requireAdminDeployer(req, res, next) {
      if (!req.user || !req.user.email) {
          return res.status(401).json({ msg: "Authentication required" })
      }

      const userEmail = req.user.email.toLowerCase().trim()
      const isAllowed = config.ADMIN_EMAILS.includes(userEmail)

      if (!isAllowed) {
          return res.status(403).json({
              msg: "Deployment and infrastructure actions are restricted to platform administrators to prevent AWS resource exhaustion in this demo environment. Feel free to explore existing projects and view deployment log replays.",
              code: "ADMIN_ONLY_ACTION"
          })
      }

      next()
  }
  ```

---

### Phase C: Data Model & Public Demo Showcase (Read-Only)

#### [MODIFY] `backend/src/models/project.js`
* Add `isDemo` boolean to the `Project` schema:
  ```javascript
  isDemo: {
      type: Boolean,
      default: false,
      index: true
  }
  ```

#### [MODIFY] `backend/src/controllers/project.controller.js`
* Update project queries so guests can view demo projects alongside their own:
  * In `handleGetUserProjects`:
    ```javascript
    const projects = await Project.find({
        $or: [{ owner: req.user._id }, { isDemo: true }]
    }).sort({ createdAt: -1 })
    ```
  * In `handleGetProjectById`:
    ```javascript
    const project = await Project.findOne({
        _id: project_id,
        $or: [{ owner: req.user._id }, { isDemo: true }]
    })
    ```
  * In `handleGetProjectDeployments`:
    ```javascript
    const project = await Project.findOne({
        _id: project_id,
        $or: [{ owner: req.user._id }, { isDemo: true }]
    }).select("_id")
    ```

#### [MODIFY] `backend/src/controllers/deployment.controller.js`
* In `handleGetDeploymentById`:
  Allow guests to fetch deployment logs if the deployment belongs to them **or** belongs to a demo project:
  ```javascript
  // Look up deployment by ID
  const deployment = await Deployment.findById(deployment_id).populate("project", "name repoUrl branch liveUrl isDemo")
  if (!deployment) return res.status(404).json({ msg: "Deployment not found" })

  // Authorize if user is owner OR project is marked as demo
  const isOwner = String(deployment.owner) === String(req.user._id)
  const isDemo = deployment.project?.isDemo === true

  if (!isOwner && !isDemo) {
      return res.status(404).json({ msg: "Deployment not found or unauthorized" })
  }
  ```

#### [MODIFY] `backend/src/sockets/index.js`
* Allow visitors to subscribe to Socket.IO project rooms if the project is owned by them **or** marked `isDemo: true`:
  ```javascript
  const project = await Project.findOne({
      _id: projectId,
      $or: [{ owner: socket.userId }, { isDemo: true }]
  }).select('_id')
  ```

---

### Phase D: Route Enforcement (Locking AWS Mutations)

#### [MODIFY] `backend/src/routes/project.routes.js`
* Apply `requireAdminDeployer` to all AWS-mutating endpoints:
  * `POST /api/project` (Create project & initial deploy)
  * `POST /api/project/:project_id/redeploy` (Redeploy)
  * `DELETE /api/project/:project_id` (AWS teardown & project deletion)
* All `GET` routes (`/`, `/:project_id`, `/:project_id/deployments`) remain protected only by `handleMiddleware` (auth), allowing non-admins to read demo showcases.

---

### Phase E: User Role Surface in Auth API

#### [MODIFY] `backend/src/controllers/auth.controller.js`
* Include `isAdmin` boolean across all auth endpoints that return a `user` object:
  1. `handleRegister` (lines 45-54): Include `isAdmin: config.ADMIN_EMAILS.includes(user.email.toLowerCase().trim())`.
  2. `handleLogin` (lines 110-117): Include `isAdmin`.
  3. `handleVerifyEmail` (lines 330-345): Include `isAdmin`.
  4. `handleGetMe` (lines 130-140): Include `isAdmin`.
* Note on `handleRefreshToken` (line 190): Remains unchanged (returns `{ accessToken }` only). The frontend retains `isAdmin` in its Zustand store.

---

### Phase F: Frontend User Experience & Showcase Badges

#### [MODIFY] `frontend/src/pages/Dashboard.jsx` & `ProjectCard.jsx`
* If a project has `isDemo: true`, display a subtle badge: `[Demo Showcase]`.
* If a non-admin visitor visits the dashboard, they immediately see the demo project(s) ready to explore rather than an empty screen.

#### [MODIFY] `frontend/src/pages/NewProject.jsx`
* Read `user` from `useAuthStore`.
* If `!user?.isAdmin`:
  * Display an info banner at the top:
    > **Demo Environment Notice:** Live cloud deployments to AWS ECS Fargate & ALB are reserved for the administrator to manage infrastructure costs. You can explore pre-deployed demo projects and view live log replays from the dashboard.
  * Disable the submit button or change its text to: `"Deploy Disabled (Admin Only)"`.

#### [MODIFY] `frontend/src/pages/ProjectDetail.jsx`
* If `!user?.isAdmin`:
  * Disable the **Redeploy** button and add a tooltip: `"Redeploy is restricted to administrators in this demo environment"`.
  * If viewing a demo project, show a small banner: `"Viewing in Demo Mode — Real-time log replays and metrics are visible, mutations are disabled."`

#### [MODIFY] `frontend/src/pages/ProjectSettings.jsx`
* If `!user?.isAdmin`:
  * **Danger Zone (Delete Project):** Disable the "Delete project" button with a message: `"Project deletion and AWS infrastructure teardown are restricted to administrators."`
  * **Webhook Secret:** Mask/hide the webhook secret for non-admin viewers.

#### [MODIFY] `frontend/src/services/api.js` (or Axios interceptors / toast handlers)
* If an unexpected 403 with `ADMIN_ONLY_ACTION` is returned, show a clear, friendly toast notification explaining the restriction rather than a generic error.

---

## 4. Verification Plan

### Automated / API Verification:
1. **Admin User Test:**
   * Login with `ADMIN_EMAIL`. Verify `user.isAdmin === true`.
   * Trigger `POST /api/project` $\to$ Expect `201 Created` and job queued.
   * Trigger `POST /api/project/:id/redeploy` $\to$ Expect `201 Created`.
   * Trigger `DELETE /api/project/:id` $\to$ Expect `200 OK` and AWS cleanup invoked.
2. **Non-Admin / Stranger Test:**
   * Register a new user with a different email. Verify `user.isAdmin === false`.
   * Attempt `POST /api/project` $\to$ Expect `403 Forbidden` with `ADMIN_ONLY_ACTION`.
   * Attempt `POST /api/project/:id/redeploy` $\to$ Expect `403 Forbidden`.
   * Attempt `DELETE /api/project/:id` $\to$ Expect `403 Forbidden`.
3. **Demo Showcase Read Access Test:**
   * Flag an existing project with `isDemo: true` in MongoDB.
   * Logged in as non-admin:
     * Call `GET /api/project` $\to$ Expect the demo project to appear in the list.
     * Call `GET /api/project/:demo_id` $\to$ Expect `200 OK`.
     * Call `GET /api/project/:demo_id/deployments` $\to$ Expect `200 OK`.
     * Call `GET /api/deployment/:demo_deployment_id` $\to$ Expect `200 OK` with full logs array.
     * Connect Socket.IO and emit `subscribe:project` with demo project ID $\to$ Expect `{ ok: true }`.
4. **No-Regression Check:**
   * Run existing unit test suites (`node scratch-alb-test.mjs`, `node scratch-teardown-test.mjs`, `node scratch-import-test.mjs`) to verify nothing is broken.

### UI Verification:
1. Log in as guest:
   * Dashboard immediately renders the demo showcase project with `[Demo Showcase]` badge.
   * Clicking the demo project opens the full project detail with working 5-step stepper and log history.
   * "New Project" shows the demo restriction banner and disabled submit button.
   * "Redeploy" and "Delete project" buttons are disabled.
2. Log in as admin:
   * Verify all features (Deploy, Redeploy, Settings/Delete) remain completely functional.

---

## 5. Resume Highlight (Bonus)

By implementing this, you turn a financial constraint into an engineering asset on your resume:
> *"Architected a role-based demo showcase environment: gated AWS serverless compute (ECS Fargate, ECR, ALB) behind admin authorization to prevent Denial-of-Wallet attacks while exposing high-fidelity, read-only build replay pipelines and WebSocket log streaming to public evaluators."*

---

## 6. Execution Phases (Step-by-Step Implementation Roadmap)

### Phase 1: Environment & Config (The Identity Layer)
* **Objective:** Teach the backend who the admin is via `.env`, parse single or multiple admin emails safely, and log a confirmation when the server boots.
* **Files:**
  * `backend/.env`
  * `backend/src/config/config.js`
* **Verification:** Start the server (`npm run dev`) and see `[Config] Admin deploy restriction active: [your-email]`.

### Phase 2: Admin Guard Middleware (The Gatekeeper)
* **Objective:** Write a clean, reusable Express middleware (`requireAdminDeployer`) that inspects `req.user.email` and returns a structured `403 Forbidden` (`ADMIN_ONLY_ACTION`) if a non-admin attempts restricted actions.
* **Files:**
  * `backend/src/middlewares/admin.middleware.js` (new file)
* **Verification:** Middleware unit logic correctly allows your email and rejects any other email.

### Phase 3: Route Lock-down (Protecting AWS Resources)
* **Objective:** Apply the gatekeeper to every endpoint that spins up or tears down AWS resources (ECS tasks, ECR pushes, ALB listener rules).
* **Files:**
  * `backend/src/routes/project.routes.js`
* **Verification:** `POST /api/project`, `POST /:id/redeploy`, and `DELETE /:id` block non-admins with 403, while `GET` routes remain open.

### Phase 4: Auth API & Role Surfacing (`isAdmin` flag)
* **Objective:** Return `isAdmin: true / false` on the user object across all auth responses so the frontend automatically knows the user's role without hardcoding emails in client code.
* **Files:**
  * `backend/src/controllers/auth.controller.js` (`handleRegister`, `handleLogin`, `handleVerifyEmail`, `handleGetMe`)
* **Verification:** Calling `/api/auth/me` or logging in returns `{ user: { username, email, isAdmin: true } }`.

### Phase 5: Public Demo Showcase (Read-Only Access for Visitors)
* **Objective:** Enable the `isDemo: true` flag so visitors can discover pre-seeded projects, replay 2,000 lines of build logs, and subscribe to WebSocket events without having write access.
* **Files:**
  * `backend/src/models/project.js`
  * `backend/src/controllers/project.controller.js`
  * `backend/src/controllers/deployment.controller.js`
  * `backend/src/sockets/index.js`
* **Verification:** A non-admin user can fetch and view a demo project's full details and logs via the API and WebSocket room.

### Phase 6: Frontend UI & Badges (Polishing the Experience)
* **Objective:** Make the UI feel deliberate and professional for visitors. Show a `[Demo Showcase]` badge, disable the "Redeploy" and "Delete" buttons gracefully for guests, and display a helpful notice on the "New Project" screen.
* **Files:**
  * `frontend/src/pages/Dashboard.jsx` & `ProjectCard.jsx`
  * `frontend/src/pages/NewProject.jsx`
  * `frontend/src/pages/ProjectDetail.jsx`
  * `frontend/src/pages/ProjectSettings.jsx`
* **Verification:** Visiting the app as a guest in the browser shows an interactive demo showcase with clear, polite admin-only notices.

