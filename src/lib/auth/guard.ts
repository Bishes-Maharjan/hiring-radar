import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isDemoMode } from "./demo";

/**
 * Ensures the caller is authenticated.
 * In DEMO_MODE: acts as a public read-only guest, bypassing auth checks.
 * In Production: validates the Auth.js session and redirects unauthenticated users to /login.
 */
export async function requireAuth(): Promise<boolean> {
  if (isDemoMode()) {
    return true;
  }

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return true;
}

/**
 * Checks whether the user is currently authenticated without redirecting.
 */
export async function isAuthenticated(): Promise<boolean> {
  if (isDemoMode()) {
    return true;
  }

  const session = await auth();
  return Boolean(session?.user?.email);
}
