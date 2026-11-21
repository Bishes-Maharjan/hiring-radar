import Link from "next/link";
import { connection } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { getDashboardStats } from "@/lib/db/repository";
import { signOutAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/auth/demo";
import { Sidebar } from "@/components/dashboard/sidebar";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  await requireAuth();
  const stats = await getDashboardStats();
  const inDemo = isDemoMode();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Demo Mode Notice Banner */}
      {inDemo && (
        <div className="bg-amber-400 text-slate-950 font-semibold px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2 border-b border-amber-500 shadow-2xs z-40 sticky top-0">
          <span>✨</span>
          <span>
            <strong>Demo mode:</strong> read-only showcase with sample data.
            Pipeline execution, status changes, and settings saves are disabled.
          </span>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Fixed Left Sidebar — hidden on mobile, visible on md+ */}
        <aside
          className={`hidden md:flex md:flex-col md:fixed md:left-0 md:w-56 bg-white border-r border-slate-200 z-30 ${
            inDemo ? "md:top-7 md:bottom-0" : "md:inset-y-0"
          }`}
        >
          {/* Logo */}
          <div className="px-4 py-4 border-b border-slate-100">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-900 hover:text-indigo-600 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
                ⚡
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block leading-tight">
                  Hiring Radar
                </span>
                <span className="text-[10px] font-medium text-slate-400 block leading-tight">
                  {inDemo ? "Public Showcase Demo" : "Kathmandu • Junior AI & Backend"}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <SidebarNav />

          {/* Stats at bottom of sidebar */}
          <div className="mt-auto border-t border-slate-100 px-3 py-3 space-y-1.5">
            <StatRow label="New Today" value={stats.newToday} tone="blue" />
            <StatRow label="Active" value={stats.total} tone="slate" />
            <StatRow label="Starred" value={stats.saved} tone="amber" />
            <StatRow label="Applied" value={stats.applied} tone="emerald" />
          </div>

          {/* Sign out action */}
          <div className="border-t border-slate-100 px-3 py-3">
            {!inDemo ? (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full text-left text-[11px] font-medium text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <div className="text-[10px] text-slate-400 px-2 py-1 italic">
                Sign-out disabled in demo
              </div>
            )}
          </div>
        </aside>

        {/* Right content area — offset by sidebar width on md+ */}
        <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
          {/* Mobile top bar — visible only on small screens */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs md:hidden">
            <div className="px-4 flex items-center justify-between h-12">
              <div className="flex items-center gap-3">
                <Sidebar stats={stats} isDemo={inDemo} />
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                    ⚡
                  </div>
                  <span className="text-sm font-bold tracking-tight text-slate-900">
                    Hiring Radar
                  </span>
                </Link>
              </div>
              {!inDemo && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </header>

          {/* Mobile stats strip */}
          <section className="bg-white border-b border-slate-200 py-2 px-4 md:hidden">
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="New" value={stats.newToday} />
              <MiniStat label="Active" value={stats.total} />
              <MiniStat label="Starred" value={stats.saved} />
              <MiniStat label="Applied" value={stats.applied} />
            </div>
          </section>

          {/* Main Page Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-3 text-center text-[11px] text-slate-400">
            Hiring Radar &bull; Automated LinkedIn Hiring Post Aggregator &bull; 100% Free Tiers
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop sidebar nav (server component) ── */
function SidebarNav() {
  const links = [
    { href: "/", label: "Jobs Feed", icon: "⚡" },
    { href: "/runs", label: "Runs", icon: "📊" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="px-3 py-4 space-y-0.5 flex-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm">{link.icon}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ── Sidebar stat row ── */
function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "slate" | "amber" | "emerald";
}) {
  const colors = {
    blue: "text-blue-600",
    slate: "text-slate-700",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
  };

  return (
    <div className="flex items-center justify-between px-2 py-1">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${colors[tone]}`}>{value}</span>
    </div>
  );
}

/* ── Mobile mini stat ── */
function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}
