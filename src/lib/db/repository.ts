import { prisma } from "./prisma";
import { Post, PostStatus, Prisma, Run, Settings } from "@prisma/client";

export interface DashboardFilterParams {
  minScore?: number;
  status?: PostStatus | "ALL";
  workMode?: string;
  experienceLevel?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "newest" | "highest_score";
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  newToday: number;
  total: number;
  saved: number;
  applied: number;
}

export interface PaginatedPostsResult {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Checks which dedupe keys already exist in either Post or SeenKey table.
 * Used by the dedupe step to discard already processed posts immediately.
 */
export async function getExistingDedupeKeys(
  keys: string[],
): Promise<Set<string>> {
  if (!keys.length) return new Set();

  const [existingPosts, existingSeenKeys] = await Promise.all([
    prisma.post.findMany({
      where: { dedupeKey: { in: keys } },
      select: { dedupeKey: true },
    }),
    prisma.seenKey.findMany({
      where: { dedupeKey: { in: keys } },
      select: { dedupeKey: true },
    }),
  ]);

  const set = new Set<string>();
  for (const p of existingPosts) set.add(p.dedupeKey);
  for (const s of existingSeenKeys) set.add(s.dedupeKey);
  return set;
}

/**
 * Upserts a classified hiring post into the Post table.
 * Uses dedupeKey as the unique conflict target.
 */
export async function upsertHiringPost(
  data: Prisma.PostCreateInput,
): Promise<Post> {
  return prisma.post.upsert({
    where: { dedupeKey: data.dedupeKey },
    create: data,
    update: {
      role: data.role,
      company: data.company,
      location: data.location,
      workMode: data.workMode,
      experienceLevel: data.experienceLevel,
      applyType: data.applyType,
      applyValue: data.applyValue,
      fitScore: data.fitScore,
      reason: data.reason,
      draftSubject: data.draftSubject,
      draftBody: data.draftBody,
      // Maintain existing status and emailedAt if already present
    },
  });
}

/**
 * Records dedupe keys of non-hiring or discarded posts into SeenKey
 * so they are not fetched or re-classified by LLM in future runs.
 */
export async function recordSeenKeys(keys: string[]): Promise<number> {
  if (!keys.length) return 0;

  const records = keys.map((dedupeKey) => ({ dedupeKey }));
  const result = await prisma.seenKey.createMany({
    data: records,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Prunes SeenKey records older than the specified retention window (default 45 days)
 * to keep Neon Postgres storage light on the free tier.
 */
export async function pruneOldSeenKeys(retentionDays = 45): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.seenKey.deleteMany({
    where: {
      seenAt: {
        lt: cutoff,
      },
    },
  });
  return result.count;
}

/**
 * Retrieves un-emailed posts with fitScore >= minScore for the daily email digest.
 * Sorted by fitScore desc, then foundAt desc.
 */
export async function getPostsForEmailDigest(
  minScore = 6,
  limit = 50,
): Promise<Post[]> {
  return prisma.post.findMany({
    where: {
      emailedAt: null,
      fitScore: { gte: minScore },
      isHiringPost: true,
      status: { not: PostStatus.DISMISSED },
    },
    orderBy: [{ fitScore: "desc" }, { foundAt: "desc" }],
    take: limit,
  });
}

/**
 * Marks given posts as emailed once the digest has been successfully transmitted.
 */
export async function markPostsAsEmailed(
  postIds: string[],
  emailedAt = new Date(),
): Promise<number> {
  if (!postIds.length) return 0;

  const result = await prisma.post.updateMany({
    where: { id: { in: postIds } },
    data: { emailedAt },
  });

  return result.count;
}

/**
 * Retrieves paginated posts for the dashboard according to URL filter parameters.
 * By default hides DISMISSED posts unless status=DISMISSED or status=ALL is selected.
 */
export async function getDashboardPosts(
  params: DashboardFilterParams = {},
): Promise<PaginatedPostsResult> {
  const {
    minScore,
    status,
    workMode,
    experienceLevel,
    search,
    startDate,
    endDate,
    sortBy = "newest",
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.PostWhereInput = {};

  // Status filtering: default hides DISMISSED
  if (status === "ALL") {
    // do not restrict status
  } else if (status) {
    where.status = status;
  } else {
    where.status = { not: PostStatus.DISMISSED };
  }

  // Min score filter
  if (typeof minScore === "number" && minScore > 0) {
    where.fitScore = { gte: minScore };
  }

  // Work mode filter
  if (workMode && workMode !== "all") {
    where.workMode = workMode;
  }

  // Experience level filter
  if (experienceLevel && experienceLevel !== "all") {
    where.experienceLevel = experienceLevel;
  }

  // Date range filters
  if (startDate || endDate) {
    where.foundAt = {};
    if (startDate) where.foundAt.gte = startDate;
    if (endDate) where.foundAt.lte = endDate;
  }

  // Text search query across role, company, snippet, reason, location
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { role: { contains: term, mode: "insensitive" } },
      { company: { contains: term, mode: "insensitive" } },
      { snippet: { contains: term, mode: "insensitive" } },
      { reason: { contains: term, mode: "insensitive" } },
      { location: { contains: term, mode: "insensitive" } },
    ];
  }

  // Sort order
  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sortBy === "highest_score"
      ? [{ fitScore: "desc" }, { foundAt: "desc" }]
      : [{ foundAt: "desc" }];

  const skip = Math.max(0, (page - 1) * pageSize);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Calculates high-level metrics for the dashboard top bar.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [newToday, total, saved, applied] = await Promise.all([
    prisma.post.count({
      where: {
        foundAt: { gte: startOfToday },
        status: PostStatus.NEW,
      },
    }),
    prisma.post.count({
      where: {
        status: { not: PostStatus.DISMISSED },
      },
    }),
    prisma.post.count({
      where: {
        status: PostStatus.SAVED,
      },
    }),
    prisma.post.count({
      where: {
        status: PostStatus.APPLIED,
      },
    }),
  ]);

  return { newToday, total, saved, applied };
}

/**
 * Updates a post status (NEW, SAVED, APPLIED, DISMISSED) with optimistic UI support.
 */
export async function updatePostStatus(
  id: string,
  status: PostStatus,
): Promise<Post> {
  return prisma.post.update({
    where: { id },
    data: { status },
  });
}

/**
 * Starts a new pipeline execution run log.
 */
export async function startRun(queriesUsed = 0): Promise<Run> {
  return prisma.run.create({
    data: {
      startedAt: new Date(),
      queriesUsed,
    },
  });
}

/**
 * Finalizes an existing pipeline execution run log with counts and optional error.
 */
export async function finishRun(
  id: string,
  stats: {
    queriesUsed?: number;
    resultsFound: number;
    newPosts: number;
    hiringPosts: number;
    emailSent: boolean;
    error?: string | null;
  },
): Promise<Run> {
  return prisma.run.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      queriesUsed: stats.queriesUsed,
      resultsFound: stats.resultsFound,
      newPosts: stats.newPosts,
      hiringPosts: stats.hiringPosts,
      emailSent: stats.emailSent,
      error: stats.error,
    },
  });
}

/**
 * Retrieves the most recent pipeline runs for the /runs dashboard view.
 */
export async function getRecentRuns(limit = 20): Promise<Run[]> {
  return prisma.run.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Settings (singleton row with id = "default")
// ---------------------------------------------------------------------------

export const EMPTY_SETTINGS = {
  id: "default" as const,
  fullName: "",
  email: "",
  phone: "",
  location: "",
  education: "",
  seeking: "",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: null,
  personalDescription: "",
  updatedAt: new Date(),
} satisfies Settings;

/**
 * Fetches the settings singleton from the database.
 * Returns the database row if present, or EMPTY_SETTINGS if not configured yet.
 */
export async function getSettings(): Promise<Settings> {
  const row = await prisma.settings.findUnique({ where: { id: "default" } });
  if (row) return row;
  return EMPTY_SETTINGS;
}

/**
 * Updates the settings singleton with partial data.
 */
export async function updateSettings(
  data: Partial<Omit<Settings, "id" | "updatedAt">>,
): Promise<Settings> {
  return prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      fullName: data.fullName ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      location: data.location ?? "",
      education: data.education ?? "",
      seeking: data.seeking ?? "",
      githubUrl: data.githubUrl ?? "",
      linkedinUrl: data.linkedinUrl ?? "",
      portfolioUrl: data.portfolioUrl ?? null,
      personalDescription: data.personalDescription ?? "",
    },
    update: data,
  });
}
