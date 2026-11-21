import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getConfig } from "@/lib/pipeline/config";
import { runDailyPipeline } from "@/lib/pipeline/runDaily";
import { isDemoMode } from "@/lib/auth/demo";

// Explicitly configure Vercel Serverless maximum duration
export const maxDuration = 60;

/**
 * Compares incoming bearer token against expected secret using crypto.timingSafeEqual.
 * Safely handles buffer length mismatches without timing leaks.
 */
export function safeTimingCompare(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/^["']|["']$/g, "");
  const cleanSecret = secret.trim().replace(/^["']|["']$/g, "");

  const bufToken = Buffer.from(cleanToken);
  const bufSecret = Buffer.from(cleanSecret);

  if (bufToken.length !== bufSecret.length) {
    // Perform dummy timing comparison on identical buffer to neutralize timing differences
    crypto.timingSafeEqual(bufToken, bufToken);
    return false;
  }

  return crypto.timingSafeEqual(bufToken, bufSecret);
}

/**
 * Validates the Authorization header against CRON_SECRET using safe timing comparison.
 */
function isAuthorized(request: NextRequest, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return false;
  }

  return safeTimingCompare(token, cronSecret);
}

/**
 * Handles daily cron triggering via POST.
 * In DEMO_MODE: always returns 404 Not Found.
 * In Production: protected by Bearer token authentication with timing-safe comparison.
 */
export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }

  const config = getConfig();

  if (!isAuthorized(request, config.CRON_SECRET)) {
    console.warn("⛔ Unauthorized attempt to trigger /api/cron/run");
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing Bearer token",
      },
      { status: 401 },
    );
  }

  console.log(
    "⏰ Authenticated cron execution requested via POST /api/cron/run",
  );
  const startTime = Date.now();

  try {
    const runResult = await runDailyPipeline();
    const durationSeconds = Number(
      ((Date.now() - startTime) / 1000).toFixed(1),
    );

    return NextResponse.json(
      {
        success: !runResult.error,
        runId: runResult.runId,
        queriesUsed: runResult.queriesUsed,
        resultsFound: runResult.resultsFound,
        newPosts: runResult.newPosts,
        hiringPosts: runResult.hiringPosts,
        emailSent: runResult.emailSent,
        durationSeconds,
        error: runResult.error ?? null,
      },
      { status: runResult.error ? 500 : 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Fatal error handling cron route:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
        durationSeconds: Number(((Date.now() - startTime) / 1000).toFixed(1)),
      },
      { status: 500 },
    );
  }
}

/**
 * Also supports GET requests for platforms with GET-only cron schedules (like Vercel Cron).
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
