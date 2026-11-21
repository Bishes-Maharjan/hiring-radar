"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { assertWritable } from "@/lib/auth/demo";
import { runDailyPipeline } from "@/lib/pipeline/runDaily";
import { PipelineRunResult } from "@/lib/pipeline/types";

export async function triggerManualRun(): Promise<PipelineRunResult> {
  await requireAuth();
  assertWritable("Run pipeline");

  console.log("🚀 Manual pipeline run triggered from dashboard.");
  const result = await runDailyPipeline();

  revalidatePath("/");
  revalidatePath("/runs");

  return result;
}
