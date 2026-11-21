import { describe, it, expect } from "vitest";
import { verifyOwnerSignIn } from "@/lib/auth/oauth-check";

describe("OAuth Sign-In Callback: Single Owner Verification", () => {
  const OWNER_EMAIL = "bishesmaharjan0909@gmail.com";

  it("allows owner email when provider is google and email_verified is true", () => {
    const result = verifyOwnerSignIn(
      {
        provider: "google",
        email: "bishesmaharjan0909@gmail.com",
        email_verified: true,
      },
      OWNER_EMAIL,
    );
    expect(result).toBe(true);
  });

  it("allows case-insensitive match of the owner email", () => {
    const result = verifyOwnerSignIn(
      {
        provider: "google",
        email: "BishesMaharjan0909@Gmail.com",
        email_verified: true,
      },
      OWNER_EMAIL,
    );
    expect(result).toBe(true);
  });

  it("rejects a different verified email", () => {
    const result = verifyOwnerSignIn(
      {
        provider: "google",
        email: "intruder@gmail.com",
        email_verified: true,
      },
      OWNER_EMAIL,
    );
    expect(result).toBe(false);
  });

  it("rejects an unverified owner email (email_verified: false)", () => {
    const result = verifyOwnerSignIn(
      {
        provider: "google",
        email: "bishesmaharjan0909@gmail.com",
        email_verified: false,
      },
      OWNER_EMAIL,
    );
    expect(result).toBe(false);
  });

  it("rejects null or undefined email_verified", () => {
    const result = verifyOwnerSignIn(
      {
        provider: "google",
        email: "bishesmaharjan0909@gmail.com",
        email_verified: null,
      },
      OWNER_EMAIL,
    );
    expect(result).toBe(false);
  });

  it("rejects substring and suffix domain lookalikes", () => {
    // Suffix attack
    expect(
      verifyOwnerSignIn(
        {
          provider: "google",
          email: "bishesmaharjan0909@gmail.com.evil.com",
          email_verified: true,
        },
        OWNER_EMAIL,
      ),
    ).toBe(false);

    // Prefix attack
    expect(
      verifyOwnerSignIn(
        {
          provider: "google",
          email: "fake-bishesmaharjan0909@gmail.com",
          email_verified: true,
        },
        OWNER_EMAIL,
      ),
    ).toBe(false);

    // Truncated attack
    expect(
      verifyOwnerSignIn(
        {
          provider: "google",
          email: "bishesmaharjan0909@gmai",
          email_verified: true,
        },
        OWNER_EMAIL,
      ),
    ).toBe(false);
  });

  it("rejects non-google providers even with verified owner email", () => {
    const providers = ["github", "credentials", "facebook", "apple", "discord"];
    for (const provider of providers) {
      const result = verifyOwnerSignIn(
        {
          provider,
          email: "bishesmaharjan0909@gmail.com",
          email_verified: true,
        },
        OWNER_EMAIL,
      );
      expect(result).toBe(false);
    }
  });

  it("rejects when owner email is undefined or empty in environment", () => {
    expect(
      verifyOwnerSignIn(
        {
          provider: "google",
          email: "bishesmaharjan0909@gmail.com",
          email_verified: true,
        },
        undefined,
      ),
    ).toBe(false);

    expect(
      verifyOwnerSignIn(
        {
          provider: "google",
          email: "bishesmaharjan0909@gmail.com",
          email_verified: true,
        },
        "",
      ),
    ).toBe(false);
  });
});
