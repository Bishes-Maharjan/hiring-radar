import Link from "next/link";
import { connection } from "next/server";
import { getRecentRuns } from "@/lib/db/repository";
import { isDemoMode } from "@/lib/auth/demo";
import { RunNowButton } from "@/components/dashboard/run-now-button";

export const instant = false;

export default async function RunsPage() {
  await connection();
  const runs = await getRecentRuns(50);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold inline-flex items-center gap-1"
            >
              &larr; Back to Feed
            </Link>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Pipeline Execution History
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Audit logs for daily cron triggers and manual scraping runs
          </p>
        </div>

        <RunNowButton isDemo={isDemoMode()} />
      </div>

      {/* Runs Table / Cards */}
      {runs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No pipeline runs logged yet. Click &ldquo;Run Pipeline Now&rdquo; to
            execute the first run.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Started At</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Queries</th>
                  <th className="px-5 py-3.5">Raw Results</th>
                  <th className="px-5 py-3.5">New Posts</th>
                  <th className="px-5 py-3.5">Hiring Matches</th>
                  <th className="px-5 py-3.5">Email Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => {
                  const durationSec = r.finishedAt
                    ? (
                        (new Date(r.finishedAt).getTime() -
                          new Date(r.startedAt).getTime()) /
                        1000
                      ).toFixed(1) + "s"
                    : "Running...";

                  const isSuccess = !r.error && r.finishedAt;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {new Date(r.startedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap font-medium">
                        {durationSec}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.error ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                            Failed
                          </span>
                        ) : isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            Running
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {r.queriesUsed}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {r.resultsFound}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {r.newPosts}
                      </td>
                      <td className="px-5 py-4 font-bold text-indigo-600">
                        {r.hiringPosts}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.emailSent ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            ✓ Transmitted
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
