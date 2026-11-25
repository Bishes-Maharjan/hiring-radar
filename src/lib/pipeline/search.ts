import fs from "fs";
import path from "path";
import { getConfig } from "./config";
import { SerpApiOrganicResult, SerpApiResponseSchema } from "./types";

export interface SearchQueryResult {
  query: string;
  results: SerpApiOrganicResult[];
  error?: string;
}

/**
 * Executes a single SerpApi Google Search query using URLSearchParams.
 * Fails soft and logs errors instead of crashing the batch.
 */
export async function executeSingleSearch(
  query: string,
  apiKey: string,
  tbs = "qdr:w",
  num = 20,
): Promise<SearchQueryResult> {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    location: "Kathmandu, Nepal",
    google_domain: "google.com.np",
    hl: "en",
    gl: "np",
    tbs,
    num: String(num),
    api_key: apiKey,
  });

  const url = `https://serpapi.com/search.json?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `⚠️ SerpApi query failed [HTTP ${res.status}] for "${query}": ${errText.slice(0, 150)}`,
      );
      return {
        query,
        results: [],
        error: `HTTP ${res.status}: ${errText.slice(0, 150)}`,
      };
    }

    const rawJson = await res.json();
    const parsed = SerpApiResponseSchema.safeParse(rawJson);

    if (!parsed.success) {
      console.warn(
        `⚠️ SerpApi response did not match schema for "${query}":`,
        parsed.error.format(),
      );
      return {
        query,
        results: rawJson?.organic_results || [],
        error: "Schema validation warning",
      };
    }

    const count = parsed.data.organic_results.length;
    console.log(`📊 Query "${query}" returned ${count} organic results.`);

    return {
      query,
      results: parsed.data.organic_results,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Network error calling SerpApi for "${query}":`, message);
    return {
      query,
      results: [],
      error: message,
    };
  }
}

/**
 * Loads mock SerpApi results from fixtures/sample-results.json in DRY_RUN mode.
 */
export function loadDryRunFixture(): SerpApiOrganicResult[] {
  const fixturePath = path.join(
    process.cwd(),
    "fixtures",
    "sample-results.json",
  );

  if (fs.existsSync(/*turbopackIgnore: true*/ fixturePath)) {
    try {
      const raw = fs.readFileSync(
        /*turbopackIgnore: true*/ fixturePath,
        "utf-8",
      );
      const json = JSON.parse(raw);
      const parsed = SerpApiResponseSchema.safeParse(json);
      if (parsed.success && parsed.data.organic_results.length > 0) {
        console.log(
          `📦 Loaded ${parsed.data.organic_results.length} results from fixture: sample-results.json`,
        );
        return parsed.data.organic_results;
      }
    } catch (err) {
      console.warn(`Failed reading fixture ${fixturePath}:`, err);
    }
  }

  console.warn(
    "⚠️ No valid fixture found in fixtures/, returning empty array.",
  );
  return [];
}

/**
 * Executes the search pipeline over configured queries.
 * Respects MAX_QUERIES_PER_RUN hard cap and fail-soft behavior per query.
 */
export async function executeSearchPipeline(): Promise<{
  queryResults: SearchQueryResult[];
  queriesUsed: number;
  totalRawResults: number;
  errors: string[];
}> {
  const config = getConfig();

  if (config.DRY_RUN) {
    console.log(
      "🧪 DRY_RUN active: using local fixture instead of live SerpApi call.",
    );
    const fixtureResults = loadDryRunFixture();
    return {
      queryResults: [
        {
          query: config.queries[0] ?? "dry-run-fixture-query",
          results: fixtureResults,
        },
      ],
      queriesUsed: 0,
      totalRawResults: fixtureResults.length,
      errors: [],
    };
  }

  const queriesToRun = config.queries.slice(0, config.MAX_QUERIES_PER_RUN);
  console.log(
    `🔍 Running search for ${queriesToRun.length} queries (capped at MAX_QUERIES_PER_RUN=${config.MAX_QUERIES_PER_RUN}, num=${config.SEARCH_NUM})...`,
  );

  const queryResults: SearchQueryResult[] = [];

  for (const query of queriesToRun) {
    console.log(`📡 Fetching SerpApi: ${query}`);
    const res = await executeSingleSearch(
      query,
      config.SERPAPI_KEY,
      "qdr:w",
      config.SEARCH_NUM,
    );
    queryResults.push(res);
  }

  const totalRawResults = queryResults.reduce(
    (sum, qr) => sum + qr.results.length,
    0,
  );

  const errors = queryResults
    .filter((qr) => qr.error)
    .map((qr) => `SerpApi failed for query "${qr.query}": ${qr.error}`);

  console.log(
    `✅ Search completed: ${queriesToRun.length} queries used, ${totalRawResults} raw results collected, ${errors.length} query error(s).`,
  );

  return {
    queryResults,
    queriesUsed: queriesToRun.length,
    totalRawResults,
    errors,
  };
}
