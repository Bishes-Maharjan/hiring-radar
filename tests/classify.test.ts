import { describe, it, expect } from "vitest";
import {
  BatchClassificationResponseSchema,
  SingleClassificationResultSchema,
} from "@/lib/pipeline/types";

describe("LLM Classification Schema Validation", () => {
  it("validates valid hiring post structured output correctly", () => {
    const validSingle = {
      postIndex: 0,
      isHiringPost: true,
      role: "Junior Backend Developer",
      company: "Necojobs Tech",
      location: "Kathmandu, Nepal",
      workMode: "hybrid",
      experienceLevel: "junior",
      applyMethod: {
        type: "email",
        value: "hr.necojobs@gmail.com",
      },
      fitScore: 9,
      reason:
        "Direct match for junior backend skillset: Node.js, NestJS, and PostgreSQL.",
      draftSubject: "Application: Junior Backend Developer - Bishes Maharjan",
      draftBody:
        "Dear Hiring Team, I am writing to express my strong interest in...",
    };

    const parsed = SingleClassificationResultSchema.safeParse(validSingle);
    expect(parsed.success).toBe(true);
  });

  it("validates non-hiring post output (e.g. job seeker or promo)", () => {
    const nonHiring = {
      postIndex: 1,
      isHiringPost: false,
      role: "Looking for job",
      company: "Independent",
      location: "Kathmandu",
      workMode: "unknown",
      experienceLevel: "unknown",
      applyMethod: {
        type: "unknown",
        value: null,
      },
      fitScore: 1,
      reason: "Candidate seeking job, not an employer hiring.",
      draftSubject: null,
      draftBody: null,
    };

    const parsed = SingleClassificationResultSchema.safeParse(nonHiring);
    expect(parsed.success).toBe(true);
  });

  it("validates full batch response schema", () => {
    const batchData = {
      classifications: [
        {
          postIndex: 0,
          isHiringPost: true,
          role: "FastAPI & AI Engineer",
          company: "AMNIL Tech",
          location: "Lalitpur, Nepal",
          workMode: "onsite",
          experienceLevel: "junior",
          applyMethod: {
            type: "email",
            value: "careers@amniltech.com",
          },
          fitScore: 10,
          reason:
            "High-value match for FastAPI, Python, Pinecone RAG, and AI engineering.",
          draftSubject: "Application: AI Engineer - Bishes Maharjan",
          draftBody:
            "Hello Team, I am eager to contribute my expertise in FastAPI and RAG...",
        },
      ],
    };

    const parsed = BatchClassificationResponseSchema.safeParse(batchData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.classifications).toHaveLength(1);
      expect(parsed.data.classifications[0].fitScore).toBe(10);
    }
  });

  it("rejects invalid fit scores outside 1-10 range", () => {
    const invalidScore = {
      postIndex: 0,
      isHiringPost: true,
      role: "Dev",
      company: "Company",
      location: "Nepal",
      workMode: "remote",
      experienceLevel: "junior",
      applyMethod: { type: "dm", value: null },
      fitScore: 15, // Out of range!
      reason: "Score too high",
      draftSubject: null,
      draftBody: null,
    };

    const parsed = SingleClassificationResultSchema.safeParse(invalidScore);
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid enum values for workMode and experienceLevel", () => {
    const invalidEnum = {
      postIndex: 0,
      isHiringPost: true,
      role: "Dev",
      company: "Company",
      location: "Nepal",
      workMode: "anywhere_on_mars", // Invalid enum!
      experienceLevel: "junior",
      applyMethod: { type: "dm", value: null },
      fitScore: 8,
      reason: "Valid reason",
      draftSubject: null,
      draftBody: null,
    };

    const parsed = SingleClassificationResultSchema.safeParse(invalidEnum);
    expect(parsed.success).toBe(false);
  });
});
