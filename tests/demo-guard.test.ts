import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { assertWritable, isDemoMode, DemoModeError } from "@/lib/auth/demo";

describe("DEMO_MODE Guards & assertWritable", () => {
  const originalEnv = process.env.DEMO_MODE;

  beforeEach(() => {
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    process.env.DEMO_MODE = originalEnv;
  });

  it("identifies demo mode correctly when DEMO_MODE='true' or '1'", () => {
    process.env.DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);

    process.env.DEMO_MODE = "1";
    expect(isDemoMode()).toBe(true);
  });

  it("identifies non-demo mode when DEMO_MODE is false or unset", () => {
    process.env.DEMO_MODE = "false";
    expect(isDemoMode()).toBe(false);

    delete process.env.DEMO_MODE;
    expect(isDemoMode()).toBe(false);
  });

  it("assertWritable passes cleanly when not in demo mode", () => {
    process.env.DEMO_MODE = "false";
    expect(() => assertWritable("Save post")).not.toThrow();
  });

  it("assertWritable throws DemoModeError when in demo mode", () => {
    process.env.DEMO_MODE = "true";
    expect(() => assertWritable("Run pipeline")).toThrow(DemoModeError);
    expect(() => assertWritable("Run pipeline")).toThrow(
      /Run pipeline is disabled in demo mode/,
    );
  });
});
