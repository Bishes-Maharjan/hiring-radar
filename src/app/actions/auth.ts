"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { requireAuth } from "@/lib/auth/guard";
import { assertWritable, isDemoMode } from "@/lib/auth/demo";

export async function signInWithGoogle(): Promise<void> {
  if (isDemoMode()) {
    redirect("/");
  }
  await signIn("google", { redirectTo: "/" });
}

export async function signOutAction(): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await requireAuth();
  assertWritable("Sign out");
  await signOut({ redirectTo: "/login" });
}
