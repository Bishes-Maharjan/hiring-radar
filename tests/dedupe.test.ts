import { describe, it, expect } from "vitest";
import {
  extractActivityId,
  derivePostedAt,
  hashSnippet,
  processRawResult,
} from "@/lib/pipeline/dedupe";

describe("Deduplication & Snowflake Parsing", () => {
  it("extracts activity ID correctly from various LinkedIn post URL formats", () => {
    const url1 =
      "https://www.linkedin.com/posts/necojobs_hiring-mernstackdeveloper-fullstackdeveloper-activity-7528429822944120833-BIvE";
    expect(extractActivityId(url1)).toBe("7528429822944120833");

    const url2 =
      "https://www.linkedin.com/feed/update/urn:li:activity:7528680455844413440/";
    expect(extractActivityId(url2)).toBe("7528680455844413440");

    const wrappedUrl =
      "https://www.google.com.np/goto?url=CAESuwEBxCJF13a7JlkTRzZTmxV1zBazz7OPvxM6v7qj4r55CJpxelwDkz3D3KJuOMmzDn98cO34d5Tu0yeJ3isP";
    expect(extractActivityId(wrappedUrl)).toBeNull();
  });

  it("correctly derives postedAt timestamp using 64-bit snowflake formula (BigInt >> 22n)", () => {
    // 7528429822944120833 >> 22n = 1794917541252 ms -> 2026-11-17T12:12:21.252Z
    const activityId = "7528429822944120833";
    const date = derivePostedAt(activityId);

    expect(date).not.toBeNull();
    expect(date?.toISOString()).toBe("2026-11-17T12:12:21.252Z");
    expect(date?.getUTCFullYear()).toBe(2026);
    expect(date?.getUTCMonth()).toBe(10); // November (0-indexed)
  });

  it("generates deterministic and normalized hashes for wrapped URLs", () => {
    const snippet1 = "WE ARE HIRING: Node.js Developer in Kathmandu";
    const snippet2 = "  we are  hiring: node.js  developer in kathmandu  ";

    const hash1 = hashSnippet(snippet1);
    const hash2 = hashSnippet(snippet2);

    expect(hash1).toBe(hash2);
    expect(hash1.startsWith("wrapped_")).toBe(true);
  });

  it("processes clean LinkedIn URLs and sets correct metadata", () => {
    const item = {
      title: "Necojobs' Post",
      link: "https://www.linkedin.com/posts/necojobs_hiring-activity-7528429822944120833-BIvE",
      snippet: "Hiring Node.js developer",
    };

    const refDate = new Date("2026-11-19T00:00:00.000Z"); // 1.5 days after post
    const candidate = processRawResult(item, "query 1", 5, refDate);

    expect(candidate).not.toBeNull();
    expect(candidate?.dedupeKey).toBe("7528429822944120833");
    expect(candidate?.urlKind).toBe("linkedin");
    expect(candidate?.postedAt?.toISOString()).toBe("2026-11-17T12:12:21.252Z");
    expect(candidate?.sourceQuery).toBe("query 1");
  });

  it("processes wrapped Google URLs gracefully with null postedAt", () => {
    const wrappedItem = {
      title: "Code Ninety's Post",
      link: "https://www.google.com.np/goto?url=CAESuwEBxCJF13a7...",
      snippet: "HIRING – Junior Developer | Remote Ready to turn your...",
    };

    const candidate = processRawResult(wrappedItem, "query 2", 5);

    expect(candidate).not.toBeNull();
    expect(candidate?.urlKind).toBe("wrapped");
    expect(candidate?.dedupeKey.startsWith("wrapped_")).toBe(true);
    expect(candidate?.postedAt).toBeNull();
    expect(candidate?.url).toBe(wrappedItem.link);
  });

  it("drops posts older than MAX_POST_AGE_DAYS when postedAt is known", () => {
    const item = {
      title: "Old Post",
      link: "https://www.linkedin.com/posts/test-activity-7528429822944120833-BIvE",
      snippet: "Old job from 10 days ago",
    };

    // Nov 17 is post date; Nov 28 is 11 days later -> should be dropped
    const refDate = new Date("2026-11-28T00:00:00.000Z");
    const candidate = processRawResult(item, "query", 5, refDate);

    expect(candidate).toBeNull();
  });

  it("does NOT drop wrapped URLs even when age filter is active", () => {
    const wrappedItem = {
      title: "Unknown date post",
      link: "https://www.google.com.np/goto?url=CAESuwEBxCJF...",
      snippet: "Junior Python Engineer",
    };

    const refDate = new Date("2026-11-28T00:00:00.000Z");
    const candidate = processRawResult(wrappedItem, "query", 5, refDate);

    expect(candidate).not.toBeNull();
    expect(candidate?.urlKind).toBe("wrapped");
    expect(candidate?.postedAt).toBeNull();
  });
});
