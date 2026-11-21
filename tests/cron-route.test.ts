import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET, safeTimingCompare } from "@/app/api/cron/run/route";
import * as runDailyModule from "@/lib/pipeline/runDaily";

describe("Cron Endpoint: POST /api/cron/run & timing-safe secret check", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_MODE = "false";
    process.env.CRON_SECRET = "super_secret_cron_token_123";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
    process.env.OWNER_EMAIL = "owner@example.com";
    process.env.AUTH_SECRET = "mock_secret_base64_1234567890";
    process.env.AUTH_GOOGLE_ID = "mock_google_client_id.apps.googleusercontent.com";
    process.env.AUTH_GOOGLE_SECRET = "mock_google_client_secret_xyz";
    process.env.SERPAPI_KEY = "mock_serpapi_key";
    process.env.GEMINI_API_KEY = "mock_gemini_key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("safeTimingCompare verifies identical strings safely", () => {
    expect(safeTimingCompare("secret123", "secret123")).toBe(true);
  });

  it("safeTimingCompare safely returns false on length mismatch without throwing", () => {
    expect(safeTimingCompare("short", "much_longer_string")).toBe(false);
    expect(safeTimingCompare("much_longer_string", "short")).toBe(false);
    expect(safeTimingCompare("", "secret")).toBe(false);
    expect(safeTimingCompare("secret", "")).toBe(false);
  });

  it("safeTimingCompare returns false on same-length different strings", () => {
    expect(safeTimingCompare("secret123", "secret456")).toBe(false);
  });

  it("returns 401 when Authorization header is completely missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/run", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Unauthorized");
  });

  it("returns 401 when Bearer token does not match CRON_SECRET", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/run", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong_token_value",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("returns 404 in DEMO_MODE (cron route completely disabled)", async () => {
    process.env.DEMO_MODE = "true";

    const req = new NextRequest("http://localhost:3000/api/cron/run", {
      method: "POST",
      headers: {
        authorization: "Bearer super_secret_cron_token_123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("executes successfully and returns 200 with metrics when token is valid", async () => {
    vi.spyOn(runDailyModule, "runDailyPipeline").mockResolvedValue({
      runId: "mock_run_999",
      startedAt: new Date(),
      finishedAt: new Date(),
      queriesUsed: 6,
      resultsFound: 20,
      newPosts: 4,
      hiringPosts: 3,
      emailSent: true,
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/cron/run", {
      method: "POST",
      headers: {
        authorization: "Bearer super_secret_cron_token_123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.runId).toBe("mock_run_999");
    expect(data.queriesUsed).toBe(6);
    expect(data.hiringPosts).toBe(3);
    expect(data.emailSent).toBe(true);
    expect(data.durationSeconds).toBeGreaterThanOrEqual(0);
  });

  it("also supports GET requests with valid token", async () => {
    vi.spyOn(runDailyModule, "runDailyPipeline").mockResolvedValue({
      runId: "mock_run_get",
      startedAt: new Date(),
      finishedAt: new Date(),
      queriesUsed: 6,
      resultsFound: 10,
      newPosts: 2,
      hiringPosts: 2,
      emailSent: true,
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/cron/run", {
      method: "GET",
      headers: {
        authorization: "Bearer super_secret_cron_token_123",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.runId).toBe("mock_run_get");
  });
});
