import { describe, it, expect } from "vitest";
import { getConfig } from "@/lib/pipeline/config";

describe("Environment & Config Validation", () => {
  const validProductionEnv = {
    DEMO_MODE: "false",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb",
    OWNER_EMAIL: "owner@example.com",
    AUTH_SECRET: "mock_secret_base64_1234567890",
    AUTH_GOOGLE_ID: "mock_google_client_id.apps.googleusercontent.com",
    AUTH_GOOGLE_SECRET: "mock_google_client_secret_xyz",
    CRON_SECRET: "mock_cron_secret_abc123",
    SERPAPI_KEY: "mock_serpapi_key",
    GEMINI_API_KEY: "mock_gemini_key",
  };

  it("parses valid non-demo production config with all required keys", () => {
    const config = getConfig(validProductionEnv);

    expect(config.DEMO_MODE).toBe(false);
    expect(config.DATABASE_URL).toBe(
      "postgresql://user:pass@localhost:5432/testdb",
    );
    expect(config.OWNER_EMAIL).toBe("owner@example.com");
    expect(config.AUTH_SECRET).toBe("mock_secret_base64_1234567890");
    expect(config.AUTH_GOOGLE_ID).toBe(
      "mock_google_client_id.apps.googleusercontent.com",
    );
    expect(config.CRON_SECRET).toBe("mock_cron_secret_abc123");
    expect(config.MAX_QUERIES_PER_RUN).toBe(7);
    expect(config.SEARCH_NUM).toBe(20);
    expect(config.MIN_SCORE).toBe(6);
    expect(config.queries.length).toBeGreaterThan(0);
  });

  it("fails in non-demo mode when OWNER_EMAIL is missing", () => {
    const env = { ...validProductionEnv, OWNER_EMAIL: "" };
    expect(() => getConfig(env)).toThrowError(/OWNER_EMAIL is required/);
  });

  it("fails in non-demo mode when AUTH_SECRET is missing", () => {
    const env = { ...validProductionEnv, AUTH_SECRET: "" };
    expect(() => getConfig(env)).toThrowError(/AUTH_SECRET is required/);
  });

  it("fails in non-demo mode when AUTH_GOOGLE_SECRET is missing", () => {
    const env = { ...validProductionEnv, AUTH_GOOGLE_SECRET: "" };
    expect(() => getConfig(env)).toThrowError(/AUTH_GOOGLE_SECRET is required/);
  });

  it("fails in non-demo mode when CRON_SECRET is missing", () => {
    const env = { ...validProductionEnv, CRON_SECRET: "" };
    expect(() => getConfig(env)).toThrowError(/CRON_SECRET is required/);
  });

  it("fails in non-demo mode when SERPAPI_KEY is missing", () => {
    const env = { ...validProductionEnv, SERPAPI_KEY: "" };
    expect(() => getConfig(env)).toThrowError(/SERPAPI_KEY is required/);
  });

  it("fails in non-demo mode when GEMINI_API_KEY is missing", () => {
    const env = { ...validProductionEnv, GEMINI_API_KEY: "" };
    expect(() => getConfig(env)).toThrowError(/GEMINI_API_KEY is required/);
  });

  it("parses valid DEMO_MODE config without any OAuth or API secrets", () => {
    const config = getConfig({
      DEMO_MODE: "true",
      DATABASE_URL: "postgresql://demo_user:demo_pass@localhost:5432/demodb",
    });

    expect(config.DEMO_MODE).toBe(true);
    expect(config.DATABASE_URL).toContain("demodb");
  });

  it("fails in DEMO_MODE if SERPAPI_KEY is present (Defense in Depth)", () => {
    expect(() =>
      getConfig({
        DEMO_MODE: "true",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/demodb",
        SERPAPI_KEY: "real_serpapi_key_leak",
      }),
    ).toThrowError(/must NOT be set when DEMO_MODE is true/);
  });

  it("fails in DEMO_MODE if GEMINI_API_KEY is present (Defense in Depth)", () => {
    expect(() =>
      getConfig({
        DEMO_MODE: "true",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/demodb",
        GEMINI_API_KEY: "real_gemini_key_leak",
      }),
    ).toThrowError(/must NOT be set when DEMO_MODE is true/);
  });

  it("fails in DEMO_MODE if AUTH_GOOGLE_SECRET is present (Defense in Depth)", () => {
    expect(() =>
      getConfig({
        DEMO_MODE: "true",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/demodb",
        AUTH_GOOGLE_SECRET: "real_oauth_secret_leak",
      }),
    ).toThrowError(/must NOT be set when DEMO_MODE is true/);
  });

  it("fails in DEMO_MODE if CRON_SECRET is present (Defense in Depth)", () => {
    expect(() =>
      getConfig({
        DEMO_MODE: "true",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/demodb",
        CRON_SECRET: "real_cron_secret_leak",
      }),
    ).toThrowError(/must NOT be set when DEMO_MODE is true/);
  });

  it("throws clear error when DATABASE_URL is missing in both modes", () => {
    expect(() =>
      getConfig({
        DEMO_MODE: "true",
        DATABASE_URL: "",
      }),
    ).toThrowError(/DATABASE_URL is required/);
  });
});
