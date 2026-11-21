import { connection } from "next/server";
import { getDashboardPosts, DashboardFilterParams } from "@/lib/db/repository";
import { PostStatus } from "@prisma/client";
import { isDemoMode } from "@/lib/auth/demo";
import { Filters } from "@/components/dashboard/filters";
import { PostCard } from "@/components/dashboard/post-card";
import { Pagination } from "@/components/dashboard/pagination";
import { RunNowButton } from "@/components/dashboard/run-now-button";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  await connection();
  const params = await searchParams;

  const search = typeof params.search === "string" ? params.search : undefined;
  const statusParam =
    typeof params.status === "string" ? params.status : undefined;
  const status =
    statusParam === "ALL"
      ? "ALL"
      : Object.values(PostStatus).includes(statusParam as PostStatus)
        ? (statusParam as PostStatus)
        : undefined;

  const minScore =
    typeof params.minScore === "string" && !isNaN(Number(params.minScore))
      ? Number(params.minScore)
      : undefined;

  const workMode =
    typeof params.workMode === "string" ? params.workMode : undefined;

  const experienceLevel =
    typeof params.level === "string" ? params.level : undefined;

  const sortBy = params.sortBy === "highest_score" ? "highest_score" : "newest";

  const page =
    typeof params.page === "string" && !isNaN(Number(params.page))
      ? Math.max(1, Number(params.page))
      : 1;

  const filterParams: DashboardFilterParams = {
    search,
    status,
    minScore,
    workMode,
    experienceLevel,
    sortBy,
    page,
    pageSize: 20,
  };

  const { posts, total, totalPages } = await getDashboardPosts(filterParams);

  return (
    <div className="space-y-4">
      {/* Top Header: Title & Manual Pipeline Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Curated Hiring Feed
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real LinkedIn posts filtered and scored for your Junior AI & Backend stack
          </p>
        </div>

        <RunNowButton isDemo={isDemoMode()} />
      </div>

      {/* Filter Controls */}
      <Filters />

      {/* Post Cards List */}
      {posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 text-lg">
            🔍
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">
            No matching hiring posts found
          </h2>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search keywords, switching from Starred/Applied to
            &ldquo;All Active&rdquo;, or run the pipeline to fetch fresh posts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={20}
      />
    </div>
  );
}
