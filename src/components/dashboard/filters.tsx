"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentMinScore = searchParams.get("minScore") || "";
  const currentWorkMode = searchParams.get("workMode") || "";
  const currentLevel = searchParams.get("level") || "";
  const currentSort = searchParams.get("sortBy") || "newest";

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  const hasActiveFilters = Boolean(
    currentSearch ||
    currentStatus ||
    currentMinScore ||
    currentWorkMode ||
    currentLevel ||
    currentSort !== "newest",
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs mb-4 space-y-3">
      {/* Search Input Row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Search roles, companies, tech (e.g. NestJS, Python, RAG, Lalitpur)..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("search", e.currentTarget.value);
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== currentSearch) {
                updateFilter("search", e.target.value);
              }
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs font-semibold px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Status Segmented Tabs + Quick Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <TabButton
            active={!currentStatus || currentStatus === ""}
            onClick={() => updateFilter("status", "")}
            label="All Active"
          />
          <TabButton
            active={currentStatus === "SAVED"}
            onClick={() => updateFilter("status", "SAVED")}
            label="⭐ Starred"
          />
          <TabButton
            active={currentStatus === "APPLIED"}
            onClick={() => updateFilter("status", "APPLIED")}
            label="✓ Applied"
          />
          <TabButton
            active={currentStatus === "DISMISSED"}
            onClick={() => updateFilter("status", "DISMISSED")}
            label="Hidden"
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Min Score */}
          <select
            value={currentMinScore}
            onChange={(e) => updateFilter("minScore", e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Any Match Score</option>
            <option value="9">★ 9+ Top Match</option>
            <option value="8">★ 8+ Great Match</option>
            <option value="7">★ 7+ Good Match</option>
            <option value="6">★ 6+ Passing</option>
          </select>

          {/* Work Mode */}
          <select
            value={currentWorkMode}
            onChange={(e) => updateFilter("workMode", e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Workplaces</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite (Kathmandu)</option>
          </select>

          {/* Experience */}
          <select
            value={currentLevel}
            onChange={(e) => updateFilter("level", e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Levels</option>
            <option value="junior">Junior</option>
            <option value="internship">Internship</option>
            <option value="mid">Mid-level</option>
          </select>

          {/* Sort */}
          <select
            value={currentSort}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Sort: Newest</option>
            <option value="highest_score">Sort: Highest Match</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors whitespace-nowrap ${
        active
          ? "bg-indigo-600 text-white shadow-2xs"
          : "bg-slate-100/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
