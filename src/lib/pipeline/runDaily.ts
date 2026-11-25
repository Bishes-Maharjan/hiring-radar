import { getConfig } from "./config";
import { executeSearchPipeline } from "./search";
import { processRawResult, deduplicateCandidates } from "./dedupe";
import { enrichCandidatePosts } from "./enrich";
import { classifyCandidates } from "./classify";
import { persistPipelineResults } from "./persist";
import { sendDailyDigest } from "./digest-email";
import { startRun, finishRun } from "../db/repository";
import { CandidatePost, PipelineRunResult } from "./types";
import { RawDiscoveredLead } from "../email/template";

/**
 * Main Daily Pipeline Orchestrator.
 * Designed to execute cleanly in both automated cron contexts (Vercel Serverless / GitHub Actions)
 * and manual dashboard "Run Now" actions.
 */
export async function runDailyPipeline(): Promise<PipelineRunResult> {
  const config = getConfig();
  const startedAt = new Date();
  console.log(
    "🚀 Starting Hiring Radar daily pipeline run at:",
    startedAt.toISOString(),
  );

  // 1. Initialize Run record in database
  const runRecord = await startRun();
  console.log(`📝 Run record initiated with ID: ${runRecord.id}`);

  let queriesUsed = 0;
  let resultsFound = 0;
  let newCandidatesCount = 0;
  let hiringPostsCount = 0;
  let emailSent = false;
  let pipelineError: string | null = null;
  const pipelineWarnings: string[] = [];

  try {
    // 2. Search SerpApi (or load fixture in DRY_RUN)
    const searchOutcome = await executeSearchPipeline();
    queriesUsed = searchOutcome.queriesUsed;
    resultsFound = searchOutcome.totalRawResults;
    if (searchOutcome.errors?.length) {
      pipelineWarnings.push(...searchOutcome.errors);
    }

    // 3. Flatten and parse raw search items into candidate posts
    const allCandidates: CandidatePost[] = [];
    for (const qr of searchOutcome.queryResults) {
      for (const item of qr.results) {
        const candidate = processRawResult(
          item,
          qr.query,
          config.MAX_POST_AGE_DAYS,
          startedAt,
        );
        if (candidate) {
          allCandidates.push(candidate);
        }
      }
    }

    console.log(
      `📊 Collected ${allCandidates.length} valid candidates within age threshold (<= ${config.MAX_POST_AGE_DAYS} days).`,
    );

    // 4. Deduplicate against in-memory duplicates and Neon Postgres Post/SeenKey tables
    const { newCandidates } = await deduplicateCandidates(allCandidates);
    newCandidatesCount = newCandidates.length;

    let otherLeads: RawDiscoveredLead[] = [];

    if (newCandidates.length === 0) {
      console.log(
        "ℹ️ No new unseen posts found in this run. Moving to email check...",
      );
    } else {
      // 5. Fail-soft enrichment: fetch full descriptions for new candidate posts
      const enriched = await enrichCandidatePosts(newCandidates);

      // 6. Gemini Batch Classification & Scoring
      const { hiringPosts, nonHiringDedupeKeys, errors: geminiErrors } =
        await classifyCandidates(enriched);
      hiringPostsCount = hiringPosts.length;
      if (geminiErrors?.length) {
        pipelineWarnings.push(...geminiErrors);
      }

      // 7. Persist to database (Post and SeenKey tables)
      await persistPipelineResults(hiringPosts, nonHiringDedupeKeys);

      // Collect other leads: anything in newCandidates that wasn't scored >= MIN_SCORE
      const highMatchKeys = new Set(
        hiringPosts
          .filter((p) => p.fitScore >= config.MIN_SCORE)
          .map((p) => p.dedupeKey),
      );

      otherLeads = newCandidates
        .filter((c) => !highMatchKeys.has(c.dedupeKey))
        .map((c) => ({
          url: c.url,
          snippet: c.snippet,
          sourceQuery: c.sourceQuery,
        }));
    }

    // 8. Generate & Send Email Digest (or out/preview.html in DRY_RUN)
    const emailResult = await sendDailyDigest(otherLeads, pipelineWarnings);
    emailSent = emailResult.emailSent;
  } catch (err: unknown) {
    pipelineError = err instanceof Error ? err.message : String(err);
    console.error("❌ Fatal error during pipeline execution:", pipelineError);
    try {
      await sendDailyDigest([], [pipelineError]);
    } catch {
      // Fail-soft if email dispatch itself fails
    }
  } finally {
    const finishedAt = new Date();
    await finishRun(runRecord.id, {
      queriesUsed,
      resultsFound,
      newPosts: newCandidatesCount,
      hiringPosts: hiringPostsCount,
      emailSent,
      error: pipelineError,
    });
    console.log(
      `🏁 Pipeline finished in ${((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)}s. Run ID: ${runRecord.id}`,
    );
  }

  return {
    runId: runRecord.id,
    startedAt,
    finishedAt: new Date(),
    queriesUsed,
    resultsFound,
    newPosts: newCandidatesCount,
    hiringPosts: hiringPostsCount,
    emailSent,
    error: pipelineError,
  };
}
