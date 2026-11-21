export interface SignInProfile {
  provider?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
}

/**
 * Validates Google OAuth sign-in against single owner rules:
 * 1. Provider must be exactly "google".
 * 2. profile.email_verified must be boolean true.
 * 3. profile.email must equal OWNER_EMAIL (case-insensitive, full-string match).
 * Rejects substrings, domain lookalikes, nulls, or unverified emails.
 */
export function verifyOwnerSignIn(
  profile: SignInProfile,
  configuredOwnerEmail?: string,
): boolean {
  if (!configuredOwnerEmail || typeof configuredOwnerEmail !== "string") {
    return false;
  }

  // 1. Provider check
  if (profile.provider !== "google") {
    return false;
  }

  // 2. Email verification check
  if (profile.email_verified !== true) {
    return false;
  }

  // 3. Email exact match
  if (!profile.email || typeof profile.email !== "string") {
    return false;
  }

  const normalizedOwner = configuredOwnerEmail.trim().toLowerCase();
  const normalizedCandidate = profile.email.trim().toLowerCase();

  if (!normalizedOwner || !normalizedCandidate) {
    return false;
  }

  return normalizedCandidate === normalizedOwner;
}
