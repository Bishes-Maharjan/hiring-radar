"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

const NAV_LINKS = [
  { href: "/", label: "Jobs Feed", icon: "⚡" },
  { href: "/runs", label: "Runs", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

interface SidebarProps {
  stats: {
    newToday: number;
    total: number;
    saved: number;
    applied: number;
  };
  isDemo?: boolean;
}

/**
 * Mobile-only sidebar drawer. On md+ screens the sidebar is rendered
 * directly in the layout as a fixed aside; this component only shows
 * the hamburger button and slide-over on small screens.
 */
export function Sidebar({ stats, isDemo }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Hamburger trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200 shadow-lg flex flex-col transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              ⚡
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Hiring Radar
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-4 space-y-0.5 flex-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Stats */}
        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          <DrawerStat label="New Today" value={stats.newToday} />
          <DrawerStat label="Active" value={stats.total} />
          <DrawerStat label="Starred" value={stats.saved} />
          <DrawerStat label="Applied" value={stats.applied} />
        </div>

        {/* Sign out (hidden/disabled in demo mode) */}
        {!isDemo ? (
          <div className="border-t border-slate-100 px-3 py-3">
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full text-left text-[11px] font-medium text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="border-t border-slate-100 px-3 py-2 text-center">
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Demo Mode Active
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function DrawerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}
