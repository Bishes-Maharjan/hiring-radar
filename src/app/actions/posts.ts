"use server";

import { revalidatePath } from "next/cache";
import { PostStatus } from "@prisma/client";
import { updatePostStatus } from "@/lib/db/repository";
import { requireAuth } from "@/lib/auth/guard";
import { assertWritable } from "@/lib/auth/demo";

export async function savePost(postId: string): Promise<void> {
  await requireAuth();
  assertWritable("Save post");
  await updatePostStatus(postId, PostStatus.SAVED);
  revalidatePath("/");
}

export async function markApplied(postId: string): Promise<void> {
  await requireAuth();
  assertWritable("Mark applied");
  await updatePostStatus(postId, PostStatus.APPLIED);
  revalidatePath("/");
}

export async function dismissPost(postId: string): Promise<void> {
  await requireAuth();
  assertWritable("Dismiss post");
  await updatePostStatus(postId, PostStatus.DISMISSED);
  revalidatePath("/");
}

export async function restorePost(postId: string): Promise<void> {
  await requireAuth();
  assertWritable("Restore post");
  await updatePostStatus(postId, PostStatus.NEW);
  revalidatePath("/");
}
