import { CandidatePost } from "./types";
import { extractActivityId, derivePostedAt } from "./dedupe";

/**
 * Decodes standard HTML entities commonly found in meta tags.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Attempts a lightweight guest fetch to obtain the full post content from <meta property="og:description">.
 * Fails soft: never throws, always returns the post with original or enriched text.
 */
export async function enrichSinglePost(
  candidate: CandidatePost,
  timeoutMs = 3500,
): Promise<CandidatePost> {
  const targetUrl = candidate.url;
  if (!targetUrl) return candidate;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return candidate;
    }

    // Check if the final redirected URL is a clean LinkedIn post URL
    const finalUrl = res.url || targetUrl;
    let enrichedUrl = candidate.url;
    let enrichedKind = candidate.urlKind;
    let enrichedPostedAt = candidate.postedAt;

    if (
      candidate.urlKind === "wrapped" &&
      finalUrl.includes("linkedin.com/posts/")
    ) {
      const discoveredId = extractActivityId(finalUrl);
      if (discoveredId) {
        enrichedUrl = finalUrl;
        enrichedKind = "linkedin";
        enrichedPostedAt = derivePostedAt(discoveredId);
      }
    }

    const html = await res.text();

    // Extract OpenGraph description tag
    const ogMatch =
      html.match(
        /<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i,
      ) ||
      html.match(
        /<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:description["']/i,
      );

    if (ogMatch && ogMatch[1]) {
      const decoded = decodeHtmlEntities(ogMatch[1].trim());
      if (decoded.length > candidate.snippet.length) {
        return {
          ...candidate,
          url: enrichedUrl,
          urlKind: enrichedKind,
          postedAt: enrichedPostedAt,
          snippet: decoded,
          fullDescription: decoded,
        };
      }
    }
  } catch {
    // Fail soft: silently retain original candidate snippet
  }

  return candidate;
}

/**
 * Enriches a batch of candidate posts concurrently with fail-soft guarantees.
 */
export async function enrichCandidatePosts(
  candidates: CandidatePost[],
): Promise<CandidatePost[]> {
  if (candidates.length === 0) return [];

  console.log(
    `🌐 Enriching ${candidates.length} posts via fail-soft guest fetch...`,
  );

  // Run in chunks of 5 to avoid socket pressure
  const CHUNK_SIZE = 5;
  const enriched: CandidatePost[] = [];

  for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map((c) => enrichSinglePost(c)),
    );
    enriched.push(...chunkResults);
  }

  const enrichedCount = enriched.filter((e) =>
    Boolean(e.fullDescription),
  ).length;
  console.log(
    `✅ Post enrichment complete: ${enrichedCount}/${candidates.length} posts obtained full descriptions.`,
  );

  return enriched;
}
