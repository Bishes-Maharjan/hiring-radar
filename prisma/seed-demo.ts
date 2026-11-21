import { PrismaClient, PostStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// REFUSE TO RUN unless DEMO_MODE=true is explicitly set
const isDemo = process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";

if (!isDemo) {
  console.error(
    "⛔ SAFETY REFUSAL: npm run seed:demo can ONLY be run when DEMO_MODE=true.",
  );
  console.error(
    "This safeguard prevents accidental data destruction on your production database.",
  );
  console.error(
    "To seed a demo database, configure a separate demo DATABASE_URL with DEMO_MODE=true.",
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not configured.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding DEMO database with realistic synthetic sample data...");

  // Clear existing demo tables
  await prisma.post.deleteMany();
  await prisma.seenKey.deleteMany();
  await prisma.run.deleteMany();
  await prisma.settings.deleteMany();

  // 1. Synthetic Settings Row
  await prisma.settings.create({
    data: {
      id: "default",
      fullName: "Demo Candidate (Public Profile)",
      email: "candidate@example.com",
      phone: "+977 9800000000",
      location: "Kathmandu, Nepal",
      education: "BCA / Computer Science, Demo College, Kathmandu",
      seeking: "Junior Backend and AI Engineering Roles",
      githubUrl: "github.com/example-demo",
      linkedinUrl: "linkedin.com/in/demo-candidate",
      portfolioUrl: "https://demo.example.com",
      personalDescription: `[DEMO SHOWCASE: Synthetically generated profile for demonstration purposes]
Core stack: TypeScript, NestJS, Next.js, Node.js, Python, PostgreSQL, Prisma, vector search with Pinecone.
Specializes in building robust APIs, background workers, and AI workflow automations.`,
    },
  });

  // 2. Realistic Synthetic Posts (all URLs and emails at example.com, no real entities)
  const syntheticPosts = [
    {
      dedupeKey: "demo_post_001",
      url: "https://example.com/posts/apex-cloud-backend-engineer",
      urlKind: "linkedin",
      snippet:
        "WE ARE HIRING! Apex Cloud Innovations is seeking a passionate Junior Backend Engineer in Kathmandu. Core requirements: TypeScript, NestJS, and PostgreSQL. Email your CV to careers@example.com",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      foundAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      sourceQuery: 'site:linkedin.com/posts hiring backend Nepal',
      isHiringPost: true,
      role: "Junior Backend Engineer (NestJS / Node)",
      company: "Apex Cloud Innovations",
      location: "Kathmandu, Nepal",
      workMode: "hybrid",
      experienceLevel: "junior",
      applyType: "email",
      applyValue: "careers@example.com",
      fitScore: 10,
      reason:
        "Direct match for junior backend stack: NestJS, TypeScript, RESTful API design, and PostgreSQL.",
      draftSubject: "Application: Junior Backend Engineer | Demo Candidate",
      draftBody: `Dear Hiring Team at Apex Cloud Innovations,

I am writing to apply for the Junior Backend Engineer position. My core focus is building robust TypeScript services using NestJS and PostgreSQL.

In recent projects, I developed production REST APIs featuring background BullMQ job queues, structured logging, and relational data modeling with Prisma and Neon PostgreSQL.

My CV is attached. You can review my work at github.com/example-demo. I welcome the opportunity for a technical discussion or take-home task.

Demo Candidate
Phone: +977 9800000000 | Email: candidate@example.com
GitHub: github.com/example-demo | LinkedIn: linkedin.com/in/demo-candidate`,
      status: PostStatus.NEW,
    },
    {
      dedupeKey: "demo_post_002",
      url: "https://example.com/posts/lumina-ai-rag-engineer",
      urlKind: "linkedin",
      snippet:
        "Exciting opportunity at Lumina AI Labs: Looking for an AI & Python Engineer to build RAG pipelines, FastAPI services, and intelligent vector search workflows. Send CV to jobs@example.com",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      foundAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
      sourceQuery: 'site:linkedin.com/posts "AI engineer" Nepal',
      isHiringPost: true,
      role: "AI & FastAPI Engineer (RAG / Automation)",
      company: "Lumina AI Research Labs",
      location: "Lalitpur, Nepal",
      workMode: "onsite",
      experienceLevel: "junior",
      applyType: "email",
      applyValue: "jobs@example.com",
      fitScore: 9,
      reason:
        "High match for Python, FastAPI, and retrieval-augmented generation (RAG) using vector databases.",
      draftSubject: "Application: AI & FastAPI Engineer | Demo Candidate",
      draftBody: `Dear Hiring Team at Lumina AI Labs,

I am applying for the AI & FastAPI Engineer role. I specialize in building retrieval pipelines with vector search and lightweight Python backends.

I have engineered WhatsApp automations using vector embeddings in Pinecone, as well as invoice OCR pipelines leveraging Gemini Vision.

My CV is attached. I would be glad to discuss how my hands-on RAG experience aligns with your team's needs.

Demo Candidate
Phone: +977 9800000000 | Email: candidate@example.com
GitHub: github.com/example-demo | LinkedIn: linkedin.com/in/demo-candidate`,
      status: PostStatus.SAVED,
    },
    {
      dedupeKey: "demo_post_003",
      url: "https://example.com/posts/crestline-fullstack-ts",
      urlKind: "linkedin",
      snippet:
        "Crestline Distributed Technologies is hiring a Remote Junior Full-Stack Developer (Next.js & Node.js). Competitive salary and flexible hours. Apply via: https://example.com/careers/apply-38291",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      foundAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
      sourceQuery: 'site:linkedin.com/posts "full stack" remote',
      isHiringPost: true,
      role: "Remote Full-Stack TypeScript Developer",
      company: "Crestline Distributed Technologies",
      location: "Remote",
      workMode: "remote",
      experienceLevel: "junior",
      applyType: "link",
      applyValue: "https://example.com/careers/apply-38291",
      fitScore: 8,
      reason:
        "Strong overlap for Next.js App Router, React Server Components, and TypeScript backend.",
      draftSubject: null,
      draftBody: null,
      status: PostStatus.APPLIED,
    },
    {
      dedupeKey: "demo_post_004",
      url: "https://example.com/posts/horizon-data-automation",
      urlKind: "linkedin",
      snippet:
        "Horizon Data Systems is looking for a Python Automation Intern. Basic knowledge of web scraping, scripting, and APIs required. DM author or email recruiting@example.com",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      foundAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
      sourceQuery: 'site:linkedin.com/posts internship backend Nepal',
      isHiringPost: true,
      role: "Python Automation Intern",
      company: "Horizon Data Systems",
      location: "Kathmandu, Nepal",
      workMode: "hybrid",
      experienceLevel: "intern",
      applyType: "email",
      applyValue: "recruiting@example.com",
      fitScore: 7,
      reason:
        "Good match for Python automation, API integrations, and ETL workflows.",
      draftSubject: "Application: Python Automation Intern | Demo Candidate",
      draftBody: `Dear Hiring Team at Horizon Data Systems,

I am writing to express my interest in the Python Automation Internship. I have extensive experience writing automated data ingestion workflows and API integrations.

I look forward to discussing how I can contribute to Horizon Data Systems.

Demo Candidate
Phone: +977 9800000000 | Email: candidate@example.com`,
      status: PostStatus.NEW,
    },
    {
      dedupeKey: "demo_post_005",
      url: "https://example.com/posts/legacy-systems-java",
      urlKind: "linkedin",
      snippet:
        "Legacy Systems Corp is looking for a Principal Java Spring Boot Engineer with 10+ years experience in enterprise financial banking systems. Apply at hr@example.com",
      postedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
      foundAt: new Date(Date.now() - 1000 * 60 * 60 * 60),
      sourceQuery: 'site:linkedin.com/posts hiring engineer Nepal',
      isHiringPost: true,
      role: "Principal Java Architect",
      company: "Legacy Enterprise Financials",
      location: "Kathmandu, Nepal",
      workMode: "onsite",
      experienceLevel: "senior",
      applyType: "email",
      applyValue: "hr@example.com",
      fitScore: 2,
      reason:
        "Senior enterprise role requiring 10+ years Java/Spring experience; completely unrelated to junior TypeScript/Python stack.",
      draftSubject: null,
      draftBody: null,
      status: PostStatus.NEW,
    },
  ];

  for (const post of syntheticPosts) {
    await prisma.post.create({ data: post });
  }

  // 3. Synthetic Pipeline Execution History
  const syntheticRuns = [
    {
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4 + 14200),
      queriesUsed: 6,
      resultsFound: 28,
      newPosts: 4,
      hiringPosts: 2,
      emailSent: false,
      error: null,
    },
    {
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 28),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 28 + 15800),
      queriesUsed: 6,
      resultsFound: 34,
      newPosts: 7,
      hiringPosts: 3,
      emailSent: false,
      error: null,
    },
  ];

  for (const run of syntheticRuns) {
    await prisma.run.create({ data: run });
  }

  console.log("✅ DEMO database successfully seeded with synthetic sample posts and run logs.");
}

main()
  .catch((e) => {
    console.error("❌ Error running demo seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
