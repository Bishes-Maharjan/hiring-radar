import { describe, it, expect } from "vitest";
import { generateDigestHtml } from "@/lib/email/template";
import { Post, PostStatus } from "@prisma/client";

describe("Email Digest Generation", () => {
  const mockPost: Post = {
    id: "post_1",
    dedupeKey: "act_123",
    url: "https://www.linkedin.com/posts/necojobs-activity-7528429822944120833",
    urlKind: "linkedin",
    snippet: "WE ARE HIRING | Node.js Backend Developer. Apply hr@necojobs.com",
    postedAt: new Date("2026-11-17T12:00:00Z"),
    foundAt: new Date("2026-11-20T12:00:00Z"),
    sourceQuery: "site:linkedin.com/posts hiring backend Nepal",
    isHiringPost: true,
    role: "Junior Backend Developer",
    company: "Necojobs Tech",
    location: "Kathmandu, Nepal",
    workMode: "hybrid",
    experienceLevel: "junior",
    applyType: "email",
    applyValue: "hr@necojobs.com",
    fitScore: 9,
    reason: "Great match for NestJS, Node, and PostgreSQL experience.",
    draftSubject: "Application: Junior Backend Developer - Bishes Maharjan",
    draftBody: "Dear Hiring Team, I am writing to apply...",
    status: PostStatus.NEW,
    emailedAt: null,
  };

  it("generates valid mobile-friendly HTML digest containing post details", () => {
    const html = generateDigestHtml([mockPost], "http://localhost:3000");

    expect(html).toContain("Hiring Radar Daily Digest");
    expect(html).toContain("Junior Backend Developer");
    expect(html).toContain("Necojobs Tech");
    expect(html).toContain("Kathmandu, Nepal");
    expect(html).toContain("9/10");
    expect(html).toContain("mailto:hr@necojobs.com");
    expect(html).toContain(
      "Great match for NestJS, Node, and PostgreSQL experience.",
    );
  });

  it("generates 1-Click Apply mailto: URL when draftSubject and draftBody are present", () => {
    const html = generateDigestHtml([mockPost], "http://localhost:3000");

    expect(html).toContain("1-Click Apply (Email)");
    expect(html).toContain("mailto:hr@necojobs.com?");
    expect(html).toContain("subject=");
    expect(html).toContain("body=");
  });

  it("renders clean empty state when no posts are provided", () => {
    const html = generateDigestHtml([], "http://localhost:3000");

    expect(html).toContain("No new high-match hiring posts found today");
  });
});
