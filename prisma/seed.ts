import "dotenv/config";
import { PostStatus } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log(
    "🌱 Seeding database with realistic hiring posts for Kathmandu candidate...",
  );

  // Clear existing demo seed data if needed
  await prisma.post.deleteMany({
    where: {
      dedupeKey: {
        in: [
          "seed-post-1-activity-7528429822944120833",
          "seed-post-2-activity-7528680455844413440",
          "seed-post-3-activity-7528991204859123456",
          "seed-post-4-activity-7528123984719284712",
          "seed-post-5-wrapped-hash-python-ai-nepal",
        ],
      },
    },
  });

  const samplePosts = [
    {
      dedupeKey: "seed-post-1-activity-7528429822944120833",
      url: "https://www.linkedin.com/posts/necojobs_hiring-mernstackdeveloper-fullstackdeveloper-activity-7528429822944120833-BIvE",
      urlKind: "linkedin",
      snippet:
        "WE ARE HIRING | Node.js Backend Developer. We are looking for a passionate developer skilled in Node.js, Express/NestJS, TypeScript, PostgreSQL, and Redis. Send CV to hr@necojobs.com.np",
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      foundAt: new Date(),
      sourceQuery:
        'site:linkedin.com/posts (hiring OR "we are hiring") (nestjs OR "node.js" OR backend) Nepal',
      isHiringPost: true,
      role: "Node.js / NestJS Backend Developer",
      company: "Necojobs Tech",
      location: "Kathmandu, Nepal",
      workMode: "hybrid",
      experienceLevel: "junior",
      applyType: "email",
      applyValue: "hr@necojobs.com.np",
      fitScore: 9,
      reason:
        "Direct match for junior backend skillset: Node.js, NestJS, TypeScript, and PostgreSQL.",
      draftSubject: "Application: Node.js / NestJS Backend Developer | Bishes Maharjan",
      draftBody: `Dear Hiring Team at Necojobs,

I am a third-year BCA student at Prime College and a backend developer applying for the Node.js / NestJS Backend Developer position.

At AideAscent, I worked on production NestJS APIs implementing BullMQ background job queues, WebSocket gateways, and role-based access control. In addition, I built and maintain an ERP system using Next.js, Prisma, and PostgreSQL that handles daily inventory and POS operations for a family import business.

My CV is attached for your review. You can also inspect my repositories at github.com/Bishes-Maharjan and connect on linkedin.com/in/bishes-maharjan-8367892a8/. I would welcome the opportunity for a technical discussion or take-home task.

Bishes Maharjan
Phone: 9866298141 | Email: bishesmaharjan0909@gmail.com
GitHub: github.com/Bishes-Maharjan | LinkedIn: linkedin.com/in/bishes-maharjan-8367892a8/`,
      status: PostStatus.NEW,
    },
    {
      dedupeKey: "seed-post-2-activity-7528680455844413440",
      url: "https://www.linkedin.com/posts/amnil-technologies_amniltechnologies-internshipopportunity-techinternship-activity-7528680455844413440-M93E",
      urlKind: "linkedin",
      snippet:
        "AMNIL Technologies is looking for a Backend Engineer (FastAPI & AI / LLM workflows). Must be familiar with Python, LangChain/LlamaIndex, RAG pipelines, and Vector DBs. Email careers@amniltech.com",
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      foundAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sourceQuery:
        'site:linkedin.com/posts (hiring OR "we are hiring") ("AI engineer" OR "machine learning" OR python OR fastapi) Nepal',
      isHiringPost: true,
      role: "AI & Backend Engineer (FastAPI / RAG)",
      company: "AMNIL Technologies Pvt. Ltd.",
      location: "Lalitpur, Nepal",
      workMode: "onsite",
      experienceLevel: "junior",
      applyType: "email",
      applyValue: "careers@amniltech.com",
      fitScore: 10,
      reason:
        "High-value match for FastAPI, Python, Pinecone RAG, and AI engineering stack in Nepal.",
      draftSubject: "Application: AI & Backend Engineer | Bishes Maharjan",
      draftBody: `Dear Hiring Team at AMNIL Technologies,

I am a third-year BCA student at Prime College and an AI/backend developer applying for the AI & Backend Engineer position.

During my AI internship at Danson Solutions, I engineered a WhatsApp RAG automation in n8n integrating the official Meta Business API with Pinecone and Gemini, including payment screenshot verification. In addition, I developed Kaji.ai, an OCR and Gemini Vision pipeline that extracts VAT invoices into Nepal IRD Annex 10/13 Excel formats, which placed 2nd at the KMC Verse hackathon.

My CV is attached. My technical work and open-source models are available at github.com/Bishes-Maharjan and linkedin.com/in/bishes-maharjan-8367892a8/. I would be glad to discuss how my hands-on RAG and Python experience can contribute to your team.

Bishes Maharjan
Phone: 9866298141 | Email: bishesmaharjan0909@gmail.com
GitHub: github.com/Bishes-Maharjan | LinkedIn: linkedin.com/in/bishes-maharjan-8367892a8/`,
      status: PostStatus.SAVED,
    },
    {
      dedupeKey: "seed-post-3-activity-7528991204859123456",
      url: "https://www.linkedin.com/posts/cloud-solutions_remote-fullstack-dev-activity-7528991204859123456-xyZa",
      urlKind: "linkedin",
      snippet:
        "We are hiring! Remote Junior Full-Stack Engineer. Stack: Next.js App Router, TypeScript, Prisma, Tailwind CSS, BullMQ background queues. Apply via link: https://apply.workable.com/cloudsolutions/j/123",
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      foundAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sourceQuery:
        'site:linkedin.com/posts (hiring OR "we are hiring") (nestjs OR "node.js" OR backend) remote',
      isHiringPost: true,
      role: "Full Stack Engineer (Next.js / TypeScript)",
      company: "Cloud Solutions Lab",
      location: "Remote (Global)",
      workMode: "remote",
      experienceLevel: "junior",
      applyType: "link",
      applyValue: "https://apply.workable.com/cloudsolutions/j/123",
      fitScore: 9,
      reason:
        "Full-stack role matching Next.js App Router, TypeScript, Prisma, and BullMQ background processing.",
      draftSubject: "Application: Full Stack Engineer | Bishes Maharjan",
      draftBody: `Dear Hiring Team at Cloud Solutions Lab,

I am a third-year BCA student at Prime College and a full-stack TypeScript developer applying for the Remote Junior Full-Stack Engineer role.

I built an end-to-end production ERP used daily by a family import business utilizing Next.js, Prisma, Neon PostgreSQL, BullMQ background queues, and GitHub Actions cron jobs. I also engineered a real-time chat and video calling application from scratch using custom WebSockets and WebRTC signalling with a NestJS backend and Next.js frontend.

My CV is attached. Feel free to review my code at github.com/Bishes-Maharjan and profile at linkedin.com/in/bishes-maharjan-8367892a8/. I would be glad to complete a technical discussion or take-home assignment.

Bishes Maharjan
Phone: 9866298141 | Email: bishesmaharjan0909@gmail.com
GitHub: github.com/Bishes-Maharjan | LinkedIn: linkedin.com/in/bishes-maharjan-8367892a8/`,
      status: PostStatus.APPLIED,
    },
    {
      dedupeKey: "seed-post-4-activity-7528123984719284712",
      url: "https://www.linkedin.com/posts/enterprise-fintech_principal-architect-activity-7528123984719284712-abCd",
      urlKind: "linkedin",
      snippet:
        "Hiring: Senior Principal Java/C++ Distributed Systems Architect. Minimum 10+ years enterprise banking experience required. Send CV to hr@enterprisebank.com",
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      foundAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      sourceQuery:
        'site:linkedin.com/posts "send your CV" (developer OR engineer) Nepal',
      isHiringPost: true,
      role: "Senior Enterprise Java Architect",
      company: "Fintech Systems Nepal",
      location: "Kathmandu, Nepal",
      workMode: "onsite",
      experienceLevel: "senior",
      applyType: "email",
      applyValue: "hr@enterprisebank.com",
      fitScore: 2,
      reason:
        "Penalized: 10+ years enterprise requirement and unrelated Java/C++ banking stack.",
      draftSubject: null,
      draftBody: null,
      status: PostStatus.DISMISSED,
    },
    {
      dedupeKey: "seed-post-5-wrapped-hash-python-ai-nepal",
      url: "https://www.linkedin.com/posts/code-ninety_juniordeveloper-softwaredeveloper-programmingjobs-activity-7527355740983029760-slcw",
      urlKind: "linkedin",
      snippet:
        "HIRING – Junior Python Developer | Remote. Ready to turn your passion into practical experience? We are looking for an aspiring Python Backend Developer developing skills in Python, Django, or FastAPI.",
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // ~3 days ago derived from activity-7527355740983029760
      foundAt: new Date(),
      sourceQuery:
        'site:linkedin.com/posts (internship OR junior) (backend OR "full stack" OR AI) Nepal',
      isHiringPost: true,
      role: "Junior Python Developer",
      company: "Code Ninety",
      location: "Remote / Nepal",
      workMode: "remote",
      experienceLevel: "junior",
      applyType: "dm",
      applyValue: null,
      fitScore: 8,
      reason:
        "Matches Python, backend development, and remote junior-friendly entry point.",
      draftSubject: "Application: Junior Python Developer | Bishes Maharjan",
      draftBody: `Dear Hiring Team at Code Ninety,

I am a third-year BCA student at Prime College and a backend developer applying for the Junior Python Developer role.

I have practical experience building backend services with Python and FastAPI, as well as developing LLM pipelines with Gemini and Pinecone. I also fine-tuned the Whisper speech model on Nepali OpenSLR data and published it on Hugging Face.

My CV is attached. You can review my repositories at github.com/Bishes-Maharjan and LinkedIn profile at linkedin.com/in/bishes-maharjan-8367892a8/. I would welcome a technical discussion or take-home assessment.

Bishes Maharjan
Phone: 9866298141 | Email: bishesmaharjan0909@gmail.com
GitHub: github.com/Bishes-Maharjan | LinkedIn: linkedin.com/in/bishes-maharjan-8367892a8/`,
      status: PostStatus.NEW,
    },
  ];

  for (const post of samplePosts) {
    await prisma.post.upsert({
      where: { dedupeKey: post.dedupeKey },
      create: post,
      update: post,
    });
  }

  // Also create a sample Run log entry
  await prisma.run.create({
    data: {
      startedAt: new Date(Date.now() - 60 * 1000),
      finishedAt: new Date(),
      queriesUsed: 6,
      resultsFound: 24,
      newPosts: 5,
      hiringPosts: 5,
      emailSent: true,
      error: null,
    },
  });

  console.log(
    "✅ Seed completed successfully with 5 posts (1 dismissed, 1 applied, 1 saved, 2 new) and 1 run log.",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
