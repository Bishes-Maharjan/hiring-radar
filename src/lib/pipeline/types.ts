import { z } from "zod";

// ==========================================
// 1. SerpApi Result Schemas
// ==========================================
export const SerpApiOrganicResultSchema = z.object({
  position: z.number().optional(),
  title: z.string().optional(),
  link: z.string(),
  snippet: z.string().default(""),
  displayed_link: z.string().optional(),
  redirect_link: z.string().optional(),
  read_more_link: z.string().optional(),
});

export type SerpApiOrganicResult = z.infer<typeof SerpApiOrganicResultSchema>;

export const SerpApiResponseSchema = z.object({
  search_metadata: z
    .object({
      id: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  organic_results: z.array(SerpApiOrganicResultSchema).default([]),
});

export type SerpApiResponse = z.infer<typeof SerpApiResponseSchema>;

// ==========================================
// 2. Candidate Post (Deduplicated & Enriched)
// ==========================================
export interface CandidatePost {
  dedupeKey: string;
  url: string;
  urlKind: "linkedin" | "wrapped";
  snippet: string;
  fullDescription?: string;
  postedAt: Date | null;
  sourceQuery: string;
}

// ==========================================
// 3. LLM Structured Output Schema
// ==========================================
export const WorkModeSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (["onsite", "hybrid", "remote"].includes(lower)) return lower;
  }
  return val;
}, z.enum(["onsite", "hybrid", "remote", "unknown"]));
export type WorkMode = z.infer<typeof WorkModeSchema>;

export const ExperienceLevelSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (["intern", "junior", "mid", "senior"].includes(lower)) return lower;
  }
  return val;
}, z.enum(["intern", "junior", "mid", "senior", "unknown"]));
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const ApplyTypeSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (lower === "email") return "email";
    if (["link", "url", "linkedin", "website"].includes(lower)) return "link";
    if (["dm", "message"].includes(lower)) return "dm";
  }
  return val;
}, z.enum(["email", "link", "dm", "unknown"]));
export type ApplyType = z.infer<typeof ApplyTypeSchema>;

export const SingleClassificationResultSchema = z.object({
  postIndex: z
    .number()
    .describe("The index of the post in the provided batch (0 to N-1)"),
  isHiringPost: z
    .boolean()
    .describe(
      "true ONLY if this is a genuine, active hiring offer from an employer or recruiter. false if it is a job-seeker looking for work, career advice, bootcamp advertisement, or company PR.",
    ),
  role: z
    .string()
    .default("Software Developer")
    .describe("Job title or role name (e.g., 'Node.js Backend Developer')"),
  company: z
    .string()
    .default("Unknown Company")
    .describe("Hiring organization or poster company"),
  location: z
    .string()
    .default("Nepal / Remote")
    .describe(
      "Job location (e.g., 'Kathmandu, Nepal', 'Remote', or 'Unknown')",
    ),
  workMode: WorkModeSchema.default("unknown").describe(
    "onsite, hybrid, remote, or unknown",
  ),
  experienceLevel: ExperienceLevelSchema.default("unknown").describe(
    "intern, junior, mid, senior, or unknown",
  ),
  applyMethod: z
    .object({
      type: ApplyTypeSchema.default("unknown"),
      value: z
        .string()
        .nullable()
        .default(null)
        .describe("Exact email address, application URL, or null if none/dm"),
    })
    .default({ type: "unknown", value: null }),
  fitScore: z
    .number()
    .min(1)
    .max(10)
    .default(5)
    .describe(
      "Match score from 1-10 for a junior developer in Kathmandu skilled in NestJS, Node.js, TypeScript, Python, FastAPI, and AI/RAG",
    ),
  reason: z
    .string()
    .default("Matches developer skillset.")
    .describe(
      "1-2 sentences explaining why this score was assigned based on the candidate's skills and experience level",
    ),
  draftSubject: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "Professional cold outreach subject line tailored to the job description (e.g. 'Application: Junior Backend Engineer')",
    ),
  draftBody: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "Tailored 110-170 word cold email connecting candidate's specific projects (AideAscent NestJS, Danson AI/RAG, ERP) to the exact requirements in the job description",
    ),
});

export type SingleClassificationResult = z.infer<
  typeof SingleClassificationResultSchema
>;

export const BatchClassificationResponseSchema = z.object({
  classifications: z.array(SingleClassificationResultSchema),
});

export type BatchClassificationResponse = z.infer<
  typeof BatchClassificationResponseSchema
>;

// ==========================================
// 4. Classified Post (Ready for Persistence)
// ==========================================
export interface ClassifiedHiringPost {
  dedupeKey: string;
  url: string;
  urlKind: "linkedin" | "wrapped";
  snippet: string;
  postedAt: Date | null;
  foundAt: Date;
  sourceQuery: string;
  isHiringPost: boolean;
  role: string;
  company: string;
  location: string;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  applyType: ApplyType;
  applyValue: string | null;
  fitScore: number;
  reason: string;
  draftSubject: string | null;
  draftBody: string | null;
}

// ==========================================
// 5. Pipeline Run Summary
// ==========================================
export interface PipelineRunResult {
  runId: string;
  startedAt: Date;
  finishedAt: Date;
  queriesUsed: number;
  resultsFound: number;
  newPosts: number;
  hiringPosts: number;
  emailSent: boolean;
  error?: string | null;
}
