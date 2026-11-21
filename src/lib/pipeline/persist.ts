import { ClassifiedHiringPost } from "./types";
import {
  upsertHiringPost,
  recordSeenKeys,
  pruneOldSeenKeys,
} from "../db/repository";

export interface PersistResult {
  persistedCount: number;
  seenRecordedCount: number;
  prunedSeenKeysCount: number;
}

/**
 * Persists classified hiring posts to the Post table and records
 * rejected post keys to the SeenKey table.
 */
export async function persistPipelineResults(
  hiringPosts: ClassifiedHiringPost[],
  nonHiringDedupeKeys: string[],
): Promise<PersistResult> {
  console.log(
    `💾 Persisting ${hiringPosts.length} hiring posts and recording ${nonHiringDedupeKeys.length} non-hiring keys...`,
  );

  let persistedCount = 0;

  for (const post of hiringPosts) {
    try {
      await upsertHiringPost({
        dedupeKey: post.dedupeKey,
        url: post.url,
        urlKind: post.urlKind,
        snippet: post.snippet,
        postedAt: post.postedAt,
        foundAt: post.foundAt,
        sourceQuery: post.sourceQuery,
        isHiringPost: true,
        role: post.role,
        company: post.company,
        location: post.location,
        workMode: post.workMode,
        experienceLevel: post.experienceLevel,
        applyType: post.applyType,
        applyValue: post.applyValue,
        fitScore: post.fitScore,
        reason: post.reason,
        draftSubject: post.draftSubject,
        draftBody: post.draftBody,
      });
      persistedCount++;
    } catch (err) {
      console.error(`❌ Failed to upsert post ${post.dedupeKey}:`, err);
    }
  }

  // Record SeenKey entries for non-hiring posts
  const seenRecordedCount = await recordSeenKeys(nonHiringDedupeKeys);

  // Prune seen keys older than 45 days
  const prunedSeenKeysCount = await pruneOldSeenKeys(45);

  console.log(
    `✅ Database persistence complete: ${persistedCount} posts saved, ${seenRecordedCount} seen keys recorded, ${prunedSeenKeysCount} expired keys pruned.`,
  );

  return {
    persistedCount,
    seenRecordedCount,
    prunedSeenKeysCount,
  };
}
