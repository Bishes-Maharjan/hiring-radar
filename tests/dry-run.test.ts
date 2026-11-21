import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { loadDryRunFixture } from "@/lib/pipeline/search";
import { processRawResult } from "@/lib/pipeline/dedupe";
import { generateDigestHtml } from "@/lib/email/template";
import { Post, PostStatus } from "@prisma/client";

describe("DRY_RUN Pipeline & Fixture Integration", () => {
  it("loads organic results successfully from fixtures/sample-results.json", () => {
    const results = loadDryRunFixture();
    expect(results.length).toBeGreaterThanOrEqual(4);

    const first = results[0];
    expect(first.title).toBe("Necojobs' Post");
    expect(first.link).toContain("necojobs");
    expect(first.snippet).toContain("Node.js");
  });

  it("processes all 4 fixture items without errors into candidate posts", () => {
    const results = loadDryRunFixture();
    const candidates = results
      .map((item) =>
        processRawResult(
          item,
          "fixture_query",
          100,
          new Date("2026-11-20T15:00:00Z"),
        ),
      )
      .filter((c) => c !== null);

    expect(candidates.length).toBe(4);

    // Items 1, 2, 3 are clean LinkedIn posts
    expect(candidates[0]?.urlKind).toBe("linkedin");
    expect(candidates[0]?.dedupeKey).toBe("7528429822944120833");
    expect(candidates[0]?.postedAt?.toISOString()).toBe(
      "2026-11-17T12:12:21.252Z",
    );

    expect(candidates[1]?.urlKind).toBe("linkedin");
    expect(candidates[1]?.dedupeKey).toBe("7527972867284586497");

    expect(candidates[2]?.urlKind).toBe("linkedin");
    expect(candidates[2]?.dedupeKey).toBe("7528680455844413440");

    // Item 4 is the wrapped Google URL
    expect(candidates[3]?.urlKind).toBe("wrapped");
    expect(candidates[3]?.dedupeKey.startsWith("wrapped_")).toBe(true);
    expect(candidates[3]?.postedAt).toBeNull();
  });

  it("generates out/preview.html successfully for dry-run inspection", () => {
    const mockPost: Post = {
      id: "preview_post_1",
      dedupeKey: "act_7528429822944120833",
      url: "https://www.linkedin.com/posts/necojobs-activity-7528429822944120833",
      urlKind: "linkedin",
      snippet:
        "WE ARE HIRING | MERN STACK DEVELOPER ... Node.js and Express.js ...",
      postedAt: new Date("2026-11-17T12:12:21.252Z"),
      foundAt: new Date(),
      sourceQuery: "site:linkedin.com/posts hiring backend Nepal",
      isHiringPost: true,
      role: "Node.js & Next.js Developer",
      company: "Necojobs Tech",
      location: "Kathmandu, Nepal",
      workMode: "hybrid",
      experienceLevel: "junior",
      applyType: "email",
      applyValue: "hr.necojobs@gmail.com",
      fitScore: 9,
      reason:
        "Direct match for junior backend developer with Node.js, Next.js and TypeScript.",
      draftSubject:
        "Application: Node.js & Next.js Developer - Bishes Maharjan",
      draftBody:
        "Hi Necojobs Team, I am a junior developer skilled in Node.js and Next.js...",
      status: PostStatus.NEW,
      emailedAt: null,
    };

    const html = generateDigestHtml([mockPost]);
    const outDir = path.resolve(process.cwd(), "out");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const previewFile = path.join(outDir, "preview.html");
    fs.writeFileSync(previewFile, html, "utf-8");

    expect(fs.existsSync(previewFile)).toBe(true);
    const savedContent = fs.readFileSync(previewFile, "utf-8");
    expect(savedContent).toContain("Necojobs Tech");
    expect(savedContent).toContain("1-Click Apply (Email)");
  });
});
