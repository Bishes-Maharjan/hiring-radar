# ⚡ Hiring Radar

**Hiring Radar** is an autonomous, single-user Next.js application (App Router) designed to find, score, and surface hidden **LinkedIn hiring feed posts** (e.g. _"We're hiring a backend engineer, send your CV to..."_) rather than formal job board listings.

It runs daily at **07:00 AM Nepal Time (01:15 AM UTC)**, evaluates posts against your specific profile, stores high-match roles in Neon Postgres, delivers a curated daily email digest, and provides an authenticated dashboard with **1-Click Apply with Gmail**.

Everything is architected to run permanently on **100% free tiers**.

---

## 🎯 Candidate Context & Targeting

- **Target Roles:** Backend Engineering, Full-Stack TypeScript, and AI/LLM Engineering.
- **Location:** Kathmandu / Lalitpur, Nepal (Onsite/Hybrid) and Global Remote.
- **Candidate Tech Stack:** TypeScript, Node.js, NestJS, Next.js, Python, FastAPI, PostgreSQL, Prisma, MongoDB, BullMQ, WebSockets/WebRTC, RAG (Pinecone), n8n automation, Whisper, Remotion, and Gemini Vision.
- **Fit Scoring Strategy:**
  - **High Score (9–10):** Junior/Mid roles with NestJS, Node.js, PostgreSQL, FastAPI, or RAG in Nepal or Remote.
  - **Medium Score (7–8):** Full-stack TypeScript or Python automation roles with adjacent stacks.
  - **Low Score (1–3):** Senior-only (5+ years) or unrelated technologies (Java Enterprise, PHP/WordPress, Ruby, C++).

---

## 🛠️ Stack & Architecture

- **Framework:** Next.js 16 (App Router, React 19, Server Components by default, Turbopack, Tailwind CSS).
- **Database:** Neon Serverless PostgreSQL with Prisma ORM.
- **Search Engine:** SerpApi Google Search (`engine=google`, `google_domain=google.com.np`, `gl=np`, `hl=en`, `tbs=qdr:d`).
- **LLM Evaluation:** Official Google GenAI SDK (`@google/genai`) using `gemini-2.5-flash` with structured JSON output and prompt-injection defenses.
- **Email Digest:** Nodemailer + Gmail App Password delivering a daily curated summary.
- **Authentication:** Password gate via Next.js 16 Proxy + signed 30-day `httpOnly` JWT session cookie.
- **Validation & Testing:** Strict Zod validation for external data and Vitest test suite.
- **Automation:** GitHub Actions cron (`15 1 * * *`) + Vercel Serverless Function (`maxDuration = 60`).

---

## 💰 Free-Tier Quota Budgeting

| Service               | Free Tier Limit                 | Hiring Radar Consumption                                             | Safety Margin                 |
| :-------------------- | :------------------------------ | :------------------------------------------------------------------- | :---------------------------- |
| **SerpApi**           | 250 searches / month            | 6 queries / day &times; 30 days = **180 searches / month**           | 70 spare queries (28% buffer) |
| **Google Gemini API** | 15 RPM / 1,500 requests / day   | Batched in chunks of 10 = **1–2 API calls / day**                    | < 0.2% of daily limit         |
| **Neon Postgres**     | 0.5 GB storage                  | Only hiring matches saved; non-hiring `SeenKey` pruned after 45 days | Uses < 5 MB                   |
| **Gmail SMTP**        | 500 emails / day                | 1 digest email / day to yourself                                     | 100% inbox placement          |
| **GitHub Actions**    | 2,000 minutes / month           | 1 curl job / day (takes ~10 seconds)                                 | Uses < 5 minutes / month      |
| **Vercel**            | 100 GB-hrs serverless execution | Daily run takes ~12–18 seconds                                       | Well within Hobby tier limits |

---

## 🧩 Pipeline Architecture

```
[SerpApi Google Search (6 queries)]
               │
               ▼
[Deduplication & Snowflake Date Derivation]
  ├── Clean URL: Extracts activity snowflake ID -> derive postedAt = BigInt(id) >> 22n
  ├── Wrapped URL: Follows 302 redirect or hashes snippet -> postedAt = null
  └── Age Cutoff: Drops posts older than MAX_POST_AGE_DAYS (5 days)
               │
               ▼
[Database Seen Filter]
  └── Queries existing keys in Post and SeenKey tables (skips already-processed posts)
               │
               ▼
[Fail-Soft Guest Enrichment]
  └── Fetches <meta property="og:description"> with 3.5s timeout (recovers full text & emails)
               │
               ▼
[Gemini Structured Batch Classification]
  ├── Verifies genuine hiring post (filters out job seekers, advice, bootcamps)
  ├── Extracts exact apply email or application link
  ├── Scores candidate fit (1–10) with reasoning
  └── Drafts cold outreach pitch + selects CV (BACKEND vs. AI_ML)
               │
               ▼
[Atomic Database Persistence]
  ├── Upserts hiring matches (isHiringPost = true) into Post
  ├── Records rejected keys in SeenKey (avoids re-evaluating)
  └── Prunes SeenKey records older than 45 days
               │
               ▼
[Daily Email Digest & Dashboard Update]
  ├── Sends HTML digest to your configured email
  └── Marks emailedAt on successful delivery
```

---

## 🚀 Setup & Local Development

### 1. Prerequisites

- Node.js 18+ (tested on Node 20 & 22)
- npm or pnpm

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/bishesmaharjan/hiring-radar.git
cd hiring-radar
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the credentials:

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# SerpApi Key (https://serpapi.com)
SERPAPI_KEY="your_serpapi_key"

# Google Gemini API Key (https://aistudio.google.com)
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.5-flash"

# Dashboard Password
DASHBOARD_PASSWORD="choose_a_strong_password"

# Cron API Secret
CRON_SECRET="generate_a_random_secret_token"

# Email Delivery (Gmail App Password)
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_16_character_gmail_app_password"
MAIL_FROM="\"Hiring Radar\" <your_email@gmail.com>"
MAIL_TO="your_email@gmail.com"

# Settings
MAX_QUERIES_PER_RUN="6"
MAX_POST_AGE_DAYS="5"
MIN_SCORE="6"
ALWAYS_SEND="false"
DRY_RUN="false"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push Database Schema & Seed Local Data

```bash
# Push schema to your Neon database
npm run prisma:push

# Seed with 5 realistic Kathmandu developer posts & a sample run log
npm run seed
```

### 5. Run the Test Suite

```bash
npm test
```

Runs all 25 automated Vitest unit and integration tests covering:

- Deduplication and 64-bit snowflake date derivation
- Age filtering and wrapped URL hashing
- LLM structured schema validation
- HTML digest generation and 1-Click Gmail Apply URL builder
- Environment parsing and type coercion
- Fixture loading and `out/preview.html` generation
- Authenticated `POST /api/cron/run` route tests

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be greeted by the password gate. Enter your `DASHBOARD_PASSWORD` to explore the dashboard.

---

## 🧪 Testing in DRY_RUN Mode

To test the entire pipeline locally without spending SerpApi quota or sending actual emails:

1. Set `DRY_RUN="true"` in `.env`.
2. Click **"Run Pipeline Now"** on the dashboard (or run the pipeline script).
3. The pipeline will:
   - Load real LinkedIn results from `fixtures/sample-results.json`.
   - Run deduplication, age filtering, and Gemini classification.
   - Save hiring posts to your database.
   - Render the HTML email and write it to `out/preview.html`.
   - Skip sending network emails via Gmail SMTP.
4. Open `out/preview.html` in your browser to inspect the digest email.

---

## ✉️ Obtaining a Gmail App Password

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. In the search bar at the top, search for **App passwords**.
4. Create a new app password named `"Hiring Radar"`.
5. Google will display a 16-character code (e.g., `abcd efgh ijkl mnop`).
6. Paste this code without spaces into `SMTP_PASS` in your `.env`.

---

## ☁️ Deployment Guide

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Settings &rarr; Environment Variables**, add all keys from your `.env`:
   - `DATABASE_URL` (use your pooled Neon connection string)
   - `SERPAPI_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-2.5-flash`)
   - `DASHBOARD_PASSWORD`
   - `CRON_SECRET`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_FROM`
   - `MAIL_TO`
   - `MAX_QUERIES_PER_RUN` (`6`)
   - `MAX_POST_AGE_DAYS` (`5`)
   - `MIN_SCORE` (`6`)
   - `ALWAYS_SEND` (`false`)
   - `DRY_RUN` (`false`)
   - `NEXT_PUBLIC_APP_URL` (`https://your-app.vercel.app`)
4. Deploy the application.

### Configuring GitHub Actions Daily Cron

1. In your GitHub repository, navigate to **Settings &rarr; Secrets and variables &rarr; Actions**.
2. Add the following repository secrets:
   - `APP_URL`: Your deployed Vercel URL (e.g., `https://hiring-radar.vercel.app`).
   - `CRON_SECRET`: The exact secret token configured in your Vercel environment.
3. The workflow file [`.github/workflows/daily-run.yml`](.github/workflows/daily-run.yml) is already configured:
   - Scheduled for `15 1 * * *` (01:15 UTC, exactly **07:00 AM Nepal Time**).
   - Can also be manually triggered anytime via the **Actions** tab in GitHub (**Workflow Dispatch**).

---

## 📋 Final Manual Verification Checklist

Before leaving the app on autopilot, run through this quick checklist:

- [ ] **Database Connection:** Run `npm run prisma:push` and verify tables (`Post`, `SeenKey`, `Run`) appear in your Neon console.
- [ ] **Seed Data:** Run `npm run seed` and verify 5 posts load on `http://localhost:3000`.
- [ ] **Authentication Gate:** Visit `http://localhost:3000` in an incognito window. Ensure you are redirected to `/login` and can log in with `DASHBOARD_PASSWORD`.
- [ ] **Optimistic UI:** Test clicking **Save**, **Mark Applied**, and **Dismiss** on a post card. Ensure the status updates instantly.
- [ ] **1-Click Apply with Gmail:** Click the red **"1-Click Apply with Gmail"** button on an email-based post card. Verify it opens Gmail Web with the recipient, customized subject, and pitch body filled in.
- [ ] **Filter Controls:** Test searching for `"FastAPI"`, filtering by `Work Mode: Remote`, and sorting by `Highest score`.
- [ ] **Execution History:** Visit `/runs` and verify the seed run log is visible with query counts and durations.
- [ ] **Manual Pipeline Trigger:** Click **"Run Pipeline Now"** in `DRY_RUN="true"` mode. Verify the status updates to success and `out/preview.html` is generated.
- [ ] **Vercel & GitHub Secrets:** Verify `APP_URL` and `CRON_SECRET` are identical in both Vercel environment settings and GitHub Actions repository secrets.
- [ ] **Manual Cron Trigger:** Go to GitHub &rarr; Actions &rarr; "Daily Hiring Radar Pipeline" &rarr; **Run workflow**. Verify the job completes with HTTP 200 in ~15 seconds.

---

## 🛡️ License

MIT License. Built for junior developers striving to stand out in the tech ecosystem.
