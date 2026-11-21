"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { assertWritable } from "@/lib/auth/demo";
import { updateSettings } from "@/lib/db/repository";

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAuth();
  assertWritable("Update settings");

  const getString = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v.trim() : undefined;
  };

  await updateSettings({
    fullName: getString("fullName") || undefined,
    email: getString("email") || undefined,
    phone: getString("phone") || undefined,
    location: getString("location") || undefined,
    education: getString("education") || undefined,
    seeking: getString("seeking") || undefined,
    githubUrl: getString("githubUrl") || undefined,
    linkedinUrl: getString("linkedinUrl") || undefined,
    portfolioUrl: getString("portfolioUrl") || null,
    personalDescription: getString("personalDescription") || undefined,
  });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/runs");
}
