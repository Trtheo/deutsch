# Deutsch Lernen

A German learning app for CEFR levels A1–B2: structured lessons, flashcards, AI-generated lessons and exams, progress tracking with XP and streaks, and an admin dashboard.

- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT auth, OpenAI
- **Frontend:** React 19 (Create React App), React Router 7, Tailwind CSS, offline support via a service worker

## Getting started

Requirements: Node.js 18+ and a MongoDB database (local or MongoDB Atlas).

1. Configure the backend:
   ```bash
   cd backend
   cp .env.example .env   # then fill in the values
   npm install
   ```
2. Install the frontend:
   ```bash
   cd frontend
   npm install
   ```
3. Run both. On Windows, double-click `start.bat`. Otherwise run these in two terminals:
   ```bash
   cd backend && npm run dev     # http://localhost:5000
   cd frontend && npm start      # http://localhost:3000
   ```

On first start the backend seeds the built-in lessons into MongoDB.

## Environment variables (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret for signing login tokens: use a long random string |
| `OPENAI_API_KEY` | no | Enables AI lesson and exam generation. Without it, template content is used |
| `PORT` | no | Backend port (default `5000`) |
| `APP_URL` | no | Frontend URL, used in password-reset emails |
| `EMAIL_USER`, `EMAIL_PASS` | no | Gmail credentials for password-reset and broadcast emails |

The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing.

## Testing

```bash
cd backend && npm test                           # API tests against an in-memory MongoDB
cd frontend && npm test -- --watchAll=false      # React unit and render tests
```

The backend tests never touch your real database or OpenAI. The first run downloads a MongoDB test binary, which takes a minute.

### Run tests automatically before every push

A git hook in `.githooks/pre-push` runs both test suites and blocks the push if any test fails. Turn it on once per clone:

```bash
git config core.hooksPath .githooks
```

To bypass it in an emergency, run `git push --no-verify`.

## Continuous integration

On every push to `main` and on every pull request, `.github/workflows/ci.yml` runs on GitHub Actions:

1. **Backend tests**
2. **Frontend tests and production build.** With `CI=true`, lint warnings fail the build.
3. **Docker images build**, which runs only after both test jobs pass.

## Docker

Run the whole stack (MongoDB, backend, and the frontend served by nginx) with one command:

```bash
docker compose up --build        # then open http://localhost:8080
docker compose down              # stop (add -v to also delete the database volume)
```

Compose reads secrets from `backend/.env`, but it overrides `MONGODB_URI` to use its own MongoDB container. Your Atlas data isn't used or changed. nginx serves the React build and forwards `/api` to the backend.

## Project structure

```
.github/workflows/ci.yml   CI pipeline
.githooks/pre-push         Runs tests before git push
docker-compose.yml         Full stack: mongo + backend + frontend
backend/
  server.js     API routes (auth, lessons, exams, progress, comments, admin)
  tests/        API tests (node:test + supertest)
  models.js     Mongoose models
  seed.js       Built-in lesson content
  fallback.js   Template lessons and exams used when OpenAI is unavailable
frontend/src/
  pages/        Home, Lesson, Exams, Flashcards, Progress, Resources, Profile, Admin
  pages/lessons/  One component per lesson type
  context/      Auth and app state (progress, XP, theme, offline queue)
  api.js        API client
  __tests__/    Frontend tests
```

## Deploying to Render

The app runs as two Render services, and the database is your MongoDB Atlas cluster:
- **The API** (`deutsch-lernen-api`), built from `backend/Dockerfile`. `render.yaml` describes it.
- **The website**, a Render Static Site built from `frontend/`.

1. **Push the repo to GitHub.**
2. **Allow Render to reach Atlas.** In Atlas, open *Network Access* and add `0.0.0.0/0`. Render's free plan has no fixed IP address. The database is still protected by its username and password.
3. **Create the API.** In Render, go to **New → Blueprint** and pick the repo. When Render asks for values, paste `MONGODB_URI`. `OPENAI_API_KEY`, `EMAIL_USER` and `EMAIL_PASS` are optional. Render generates `JWT_SECRET`.
4. **Create the website.** Go to **New → Static Site** and pick the repo, then:
   - Root Directory: `frontend`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `build`
   - Environment: `REACT_APP_API_HOST` = the API's public host, for example `deutsch-lernen-api-67oz.onrender.com`, and `NODE_VERSION` = `22`
   - **Redirects/Rewrites:** `/*` → `/index.html`, action *Rewrite*. Without this rule, links like `/exams` and password-reset links show "Not Found".
   - **Headers:** `/sw.js`, `Cache-Control: no-cache`
5. **Set the website address on the API.** Set `APP_URL` on the API service to the website URL, for example `https://deutsch-zqym.onrender.com`. Password-reset emails link to it.

`REACT_APP_API_HOST` is built into the website. If you change it, use **Manual Deploy → Clear build cache & deploy**.

After that, every push to `main` redeploys both services. The CI checks run on GitHub at the same time.

On the free plan, the API sleeps after 15 minutes without traffic. The first request after that takes about a minute while it wakes up. A paid instance stays awake.

## Lesson content

All built-in lessons are hand-written, from A1 to B1. They cover everyday topics, health, housing, transport, work and official matters, verbs, grammar, and certificate-style practice exams. Each lesson has its own **exam bank**, so exams for built-in lessons never use AI. AI is used only when a user generates their own lesson.

- `backend/seed.js` holds the 17 original lessons. Their exam banks are in `backend/content/core-exams.js`.
- `backend/content/*.js` holds every other lesson. `backend/content/SCHEMA.md` describes the format and quality rules.

To add a lesson:

```bash
cd backend
# 1. Add the lesson object to a file in content/ (see SCHEMA.md)
npm run validate-content   # checks the format, exam answers and icon names
npm run catalog            # regenerates frontend/src/lessonCatalog.js
```

The server adds new lessons to MongoDB on its next start. The tests fail if the content is invalid or the catalog is out of date.

## Access rules

- Every page needs a login.
- Users can delete only the AI lessons and exams they generated. Admins can delete any of them.
- Resource uploads accept `.txt` and `.md` files up to 1 MB, or an `http(s)` link.
- To make someone an admin, set `role: "admin"` on their user document in MongoDB. After that they can promote other users from the Admin page.
