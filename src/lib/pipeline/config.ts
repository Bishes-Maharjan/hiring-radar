import { z } from "zod";
import fs from "fs";
import path from "path";

export const ConfigSchema = z
  .object({
    DEMO_MODE: z
      .preprocess(
        (val) => val === true || val === "true" || val === "1",
        z.boolean(),
      )
      .default(false),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    // Auth & Owner (Required when DEMO_MODE is false)
    OWNER_EMAIL: z.string().email("OWNER_EMAIL must be a valid email").optional(),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required").optional(),
    AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required").optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required").optional(),
    CRON_SECRET: z.string().min(1, "CRON_SECRET is required").optional(),

    // Scraping & LLM (Required when DEMO_MODE is false)
    SERPAPI_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

    // Email Configuration
    GMAIL_APP_PASSWORD: z.string().optional(),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    MAIL_FROM: z.string().default("Hiring Radar"),
    MAIL_TO: z.string().default(""),
    RESEND_API_KEY: z.string().optional(),

    // Thresholds & Limits
    MAX_QUERIES_PER_RUN: z.coerce.number().min(1).max(20).default(7),
    SEARCH_NUM: z.coerce.number().min(10).max(100).default(20),
    MAX_POST_AGE_DAYS: z.coerce.number().min(1).max(30).default(5),
    MIN_SCORE: z.coerce.number().min(1).max(10).default(6),
    ALWAYS_SEND: z
      .preprocess((val) => val === true || val === "true", z.boolean())
      .default(false),
    DRY_RUN: z
      .preprocess((val) => val === true || val === "true", z.boolean())
      .default(false),
    NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  })
  .superRefine((data, ctx) => {
    if (data.DEMO_MODE) {
      // DEFENSE IN DEPTH: Demo mode must NEVER hold real secrets.
      // App refuses to start if any secret is set.
      const forbidden: Array<{ key: string; val: unknown }> = [
        { key: "SERPAPI_KEY", val: data.SERPAPI_KEY },
        { key: "GEMINI_API_KEY", val: data.GEMINI_API_KEY },
        {
          key: "GMAIL_APP_PASSWORD",
          val: data.GMAIL_APP_PASSWORD || (data.SMTP_PASS.trim().length > 0 ? data.SMTP_PASS : undefined),
        },
        { key: "CRON_SECRET", val: data.CRON_SECRET },
        { key: "AUTH_GOOGLE_SECRET", val: data.AUTH_GOOGLE_SECRET },
      ];

      for (const item of forbidden) {
        if (
          item.val &&
          typeof item.val === "string" &&
          item.val.trim().length > 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [item.key],
            message: `Security violation: ${item.key} must NOT be set when DEMO_MODE is true. Demo deployments must never hold real secrets.`,
          });
        }
      }
    } else {
      // Production mode: Google OAuth, Owner email, and Pipeline secrets are required
      if (!data.OWNER_EMAIL || data.OWNER_EMAIL.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["OWNER_EMAIL"],
          message: "OWNER_EMAIL is required when DEMO_MODE is false.",
        });
      }
      if (!data.AUTH_SECRET || data.AUTH_SECRET.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_SECRET"],
          message: "AUTH_SECRET is required when DEMO_MODE is false.",
        });
      }
      if (!data.AUTH_GOOGLE_ID || data.AUTH_GOOGLE_ID.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_GOOGLE_ID"],
          message: "AUTH_GOOGLE_ID is required when DEMO_MODE is false.",
        });
      }
      if (!data.AUTH_GOOGLE_SECRET || data.AUTH_GOOGLE_SECRET.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_GOOGLE_SECRET"],
          message: "AUTH_GOOGLE_SECRET is required when DEMO_MODE is false.",
        });
      }
      if (!data.CRON_SECRET || data.CRON_SECRET.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CRON_SECRET"],
          message: "CRON_SECRET is required when DEMO_MODE is false.",
        });
      }
      if (!data.SERPAPI_KEY || data.SERPAPI_KEY.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SERPAPI_KEY"],
          message: "SERPAPI_KEY is required when DEMO_MODE is false.",
        });
      }
      if (!data.GEMINI_API_KEY || data.GEMINI_API_KEY.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["GEMINI_API_KEY"],
          message: "GEMINI_API_KEY is required when DEMO_MODE is false.",
        });
      }
    }
  });

export type PipelineConfig = z.infer<typeof ConfigSchema> & {
  queries: string[];
  // Provide guaranteed strings for typed usage in non-demo mode
  OWNER_EMAIL: string;
  CRON_SECRET: string;
  SERPAPI_KEY: string;
  GEMINI_API_KEY: string;
};

let cachedConfig: PipelineConfig | null = null;

export function loadQueries(): string[] {
  try {
    const queriesPath = path.resolve(process.cwd(), "queries.json");
    if (fs.existsSync(queriesPath)) {
      const content = fs.readFileSync(queriesPath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(
      "⚠️ Could not load queries.json, falling back to default queries:",
      err,
    );
  }

  // Fallback defaults if queries.json is missing or unreadable
  return [
    'site:linkedin.com/posts (hiring OR "we are hiring" OR "looking for") (nestjs OR "node.js" OR backend OR "full stack") (Nepal OR Kathmandu OR Lalitpur)',
    'site:linkedin.com/posts ("send your CV" OR "share your resume" OR "apply at" OR "drop your CV" OR "subject line") (developer OR engineer OR intern) (Nepal OR Kathmandu)',
    'site:linkedin.com/posts (hiring OR "join our team") ("AI engineer" OR "machine learning" OR python OR fastapi) (Nepal OR Kathmandu)',
    'site:linkedin.com/posts (intern OR internship OR junior OR fresher) (backend OR developer OR software) (Nepal OR Kathmandu)',
    'site:linkedin.com/posts (#jobsinnepal OR #nepaltech OR #itjobs) (backend OR developer OR intern OR fresher)',
    'site:linkedin.com/posts ("Internship in Nepal" OR InternSathi OR "Freshers Jobs" OR TalentSathi OR Slicejob OR NecoJobs) (backend OR "full stack" OR python OR node OR AI)',
    'site:linkedin.com/posts (hiring OR "we are hiring") (backend OR "full stack" OR "AI engineer") (remote OR "work from home") (Nepal OR Kathmandu)',
  ];
}

export function getConfig(
  overrideEnv?: Record<string, string | undefined>,
): PipelineConfig {
  if (cachedConfig && !overrideEnv) {
    return cachedConfig;
  }

  const env = overrideEnv ?? process.env;
  const parsed = ConfigSchema.safeParse(env);

  if (!parsed.success) {
    const issues = parsed.error.issues || [];
    const errorDetails =
      issues.length > 0
        ? issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        : parsed.error.message;
    throw new Error(`Invalid environment configuration: ${errorDetails}`);
  }

  const queries = loadQueries();

  const config: PipelineConfig = {
    ...parsed.data,
    queries,
    OWNER_EMAIL: parsed.data.OWNER_EMAIL ?? "",
    CRON_SECRET: parsed.data.CRON_SECRET ?? "",
    SERPAPI_KEY: parsed.data.SERPAPI_KEY ?? "",
    GEMINI_API_KEY: parsed.data.GEMINI_API_KEY ?? "",
  };

  if (!overrideEnv) {
    cachedConfig = config;
  }

  return config;
}
