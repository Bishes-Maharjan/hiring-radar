import crypto from "crypto";
import { CandidatePost, SerpApiOrganicResult } from "./types";
import { getExistingDedupeKeys } from "../db/repository";

/**
 * Extracts a 64-bit LinkedIn activity snowflake ID from a URL.
 * Handles patterns such as:
 * - /posts/...-activity-7528429822944120833-BIvE
 * - /feed/update/urn:li:activity:7528429822944120833
 * - activity-7528429822944120833
 */
export function extractActivityId(url: string): string | null {
  if (!url) return null;

  // Match urn:li:activity:1234567890
  const urnMatch = url.match(/urn:li:activity:(\d{15,22})/i);
  if (urnMatch) return urnMatch[1];

  // Match activity-1234567890
  const actMatch = url.match(/activity-(\d{15,22})/i);
  if (actMatch) return actMatch[1];

  // Match trailing snowflake ID after hyphen
  const hypMatch = url.match(/-(\d{18,22})(?:-[a-zA-Z0-9_-]+|\/|\?|$)/);
  if (hypMatch) return hypMatch[1];

  return null;
}

/**
 * Derives the posted Date from a LinkedIn 64-bit snowflake activity ID.
 * Mathematical formula: new Date(Number(BigInt(activityId) >> 22n))
 */
export function derivePostedAt(activityId: string): Date | null {
  try {
    const rawBigInt = BigInt(activityId);
    const timestampMs = Number(rawBigInt >> BigInt(22));

    // Sanity check: valid timestamp between year 2010 and 2040
    if (timestampMs > 1262304000000 && timestampMs < 2208988800000) {
      const date = new Date(timestampMs);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  } catch (err) {
    console.warn(
      `Failed deriving postedAt from activityId "${activityId}":`,
      err,
    );
  }
  return null;
}

/**
 * Computes a deterministic SHA-256 hash for wrapped URLs based on normalized snippet text.
 */
export function hashSnippet(snippet: string): string {
  const normalized = snippet.toLowerCase().replace(/\s+/g, " ").trim();
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return `wrapped_${hash.slice(0, 32)}`;
}

/**
 * Inspects a raw SerpApi result and determines its dedupeKey, urlKind, and postedAt.
 * Drops posts that exceed MAX_POST_AGE_DAYS.
 */
export function processRawResult(
  item: SerpApiOrganicResult,
  sourceQuery: string,
  maxAgeDays = 5,
  now = new Date(),
): CandidatePost | null {
  const rawUrl = item.link || "";
  const snippet = item.snippet || "";

  // Check if it is a Google wrapper or contains an activity snowflake
  const activityId = extractActivityId(rawUrl);

  let dedupeKey: string;
  let urlKind: "linkedin" | "wrapped";
  let postedAt: Date | null = null;

  if (activityId) {
    dedupeKey = activityId;
    urlKind = "linkedin";
    postedAt = derivePostedAt(activityId);
  } else {
    // Wrapped URL or unrecognizable LinkedIn URL format
    urlKind = "wrapped";
    dedupeKey = hashSnippet(snippet || rawUrl);
    postedAt = null;
  }

  // Filter by age if postedAt is known
  if (postedAt !== null) {
    const ageMs = now.getTime() - postedAt.getTime();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    if (ageMs > maxAgeMs) {
      // Discard post older than MAX_POST_AGE_DAYS
      return null;
    }
  }

  return {
    dedupeKey,
    url: rawUrl,
    urlKind,
    snippet,
    postedAt,
    sourceQuery,
  };
}

/**
 * Deduplicates candidate posts in-memory, then checks against existing
 * Post and SeenKey tables in Neon Postgres to eliminate duplicates.
 */
export async function deduplicateCandidates(
  candidates: CandidatePost[],
): Promise<{
  newCandidates: CandidatePost[];
  skippedCount: number;
}> {
  // 1. In-memory deduplication across queries
  const uniqueMap = new Map<string, CandidatePost>();
  for (const c of candidates) {
    if (!uniqueMap.has(c.dedupeKey)) {
      uniqueMap.set(c.dedupeKey, c);
    }
  }

  const inMemoryCandidates = Array.from(uniqueMap.values());
  if (inMemoryCandidates.length === 0) {
    return { newCandidates: [], skippedCount: 0 };
  }

  // 2. Query Neon Postgres to find dedupeKeys that already exist
  const candidateKeys = inMemoryCandidates.map((c) => c.dedupeKey);
  const existingKeys = await getExistingDedupeKeys(candidateKeys);

  const newCandidates = inMemoryCandidates.filter(
    (c) => !existingKeys.has(c.dedupeKey),
  );

  const skippedCount = candidates.length - newCandidates.length;

  console.log(
    `🔍 Deduplication: ${candidates.length} raw candidates -> ${inMemoryCandidates.length} unique in memory -> ${newCandidates.length} genuinely new (skipped ${skippedCount} existing/duplicate posts).`,
  );

  return { newCandidates, skippedCount };
}
