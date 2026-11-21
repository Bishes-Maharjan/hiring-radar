"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Post, PostStatus } from "@prisma/client";
import {
  savePost,
  markApplied,
  dismissPost,
  restorePost,
} from "@/app/actions/posts";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    post.status,
    (_current, next: PostStatus) => next,
  );

  const [showDraft, setShowDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [showFullSnippet, setShowFullSnippet] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleStatusToggle = (targetStatus: PostStatus) => {
    setStatusMessage(null);
    startTransition(async () => {
      setOptimisticStatus(targetStatus);
      try {
        if (targetStatus === PostStatus.SAVED) await savePost(post.id);
        else if (targetStatus === PostStatus.APPLIED) await markApplied(post.id);
        else if (targetStatus === PostStatus.DISMISSED) await dismissPost(post.id);
        else if (targetStatus === PostStatus.NEW) await restorePost(post.id);
      } catch (err: unknown) {
        // Revert optimistic status on error
        setOptimisticStatus(post.status);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("demo mode") || msg.includes("DemoModeError")) {
          setStatusMessage("Disabled in the demo: post status cannot be changed.");
        } else {
          setStatusMessage(`Action failed: ${msg}`);
        }
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });
  };

  const copyDraftToClipboard = () => {
    if (!post.draftBody) return;
    const fullText = `Subject: ${post.draftSubject || ""}\n\n${post.draftBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // RFC 6068 mailto URL (uses encodeURIComponent so spaces encode as %20 rather than +)
  const mailtoUrl = (() => {
    if (post.applyType !== "email" || !post.applyValue) return null;
    const subject =
      post.draftSubject || `Application: ${post.role}`;
    const body = post.draftBody || "";
    const params: string[] = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    return `mailto:${post.applyValue}${params.length ? `?${params.join("&")}` : ""}`;
  })();

  const handleApplyClick = () => {
    if (optimisticStatus !== PostStatus.APPLIED) {
      handleStatusToggle(PostStatus.APPLIED);
    }
  };

  // Score badge design
  const getScoreBadge = (score: number) => {
    if (score >= 9) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (score >= 7) {
      return "bg-blue-50 text-blue-800 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const foundDateFormatted = new Date(post.foundAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );

  const isSaved = optimisticStatus === PostStatus.SAVED;
  const isApplied = optimisticStatus === PostStatus.APPLIED;
  const isDismissed = optimisticStatus === PostStatus.DISMISSED;

  return (
    <article
      className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-sm transition-all ${isDismissed
          ? "border-slate-200 opacity-60 bg-slate-50/50"
          : "border-slate-200/90 hover:border-slate-300"
        }`}
    >
      {/* Top Header: Role, Company, Tags & Fit Score */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
              {post.role}
            </h2>
            {isApplied && (
              <span className="text-[10px] font-bold px-2 py-px rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Applied
              </span>
            )}
            {isSaved && (
              <span className="text-[10px] font-bold px-2 py-px rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ⭐ Starred
              </span>
            )}
            {isDismissed && (
              <span className="text-[10px] font-bold px-2 py-px rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Hidden
              </span>
            )}
          </div>

          {/* Company & Meta Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 font-medium">
            <span className="text-slate-900 font-semibold flex items-center gap-0.5">
              🏢 {post.company}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="flex items-center gap-0.5 text-slate-600">
              📍 {post.location}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="uppercase text-[9px] tracking-wider font-semibold bg-slate-100 text-slate-600 px-1.5 py-px rounded border border-slate-200/60">
              {post.workMode}
            </span>
            <span className="uppercase text-[9px] tracking-wider font-semibold bg-slate-100 text-slate-600 px-1.5 py-px rounded border border-slate-200/60">
              {post.experienceLevel}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-400">
              {foundDateFormatted}
            </span>
          </div>
        </div>

        {/* Fit Score Pill */}
        <div className="flex items-center sm:self-start shrink-0">
          <div
            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold tracking-tight shadow-2xs flex items-center gap-1 ${getScoreBadge(
              post.fitScore,
            )}`}
          >
            <span>★</span>
            <span>{post.fitScore}/10</span>
          </div>
        </div>
      </div>

      {/* AI Match Reason Box */}
      <div className="bg-indigo-50/50 border-l-3 border-indigo-600 rounded-r-lg px-3 py-2 text-[11px] text-slate-700 mb-2.5 leading-relaxed">
        <strong className="text-indigo-900 font-bold">Match: </strong>
        {post.reason}
      </div>

      {/* Raw Post Excerpt */}
      <div className="text-[11px] text-slate-600 mb-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
        <p className={showFullSnippet ? "" : "line-clamp-2 leading-relaxed"}>
          &ldquo;{post.snippet}&rdquo;
        </p>
        {post.snippet.length > 180 && (
          <button
            onClick={() => setShowFullSnippet(!showFullSnippet)}
            className="text-indigo-600 font-semibold text-[10px] mt-1 hover:underline block"
          >
            {showFullSnippet ? "Show less" : "Read full snippet ↓"}
          </button>
        )}
      </div>

      {/* AI Draft Outreach Drawer */}
      {post.draftSubject && post.draftBody && (
        <div className="mb-3">
          <button
            onClick={() => setShowDraft(!showDraft)}
            className="w-full flex items-center justify-between text-[11px] font-semibold px-3 py-2 rounded-lg bg-slate-100/70 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>✍️</span>
              <span>AI Outreach Draft</span>
            </span>
            <span className="text-slate-400 text-[10px]">
              {showDraft ? "Hide ▲" : "Preview ▼"}
            </span>
          </button>

          {showDraft && (
            <div className="mt-2 bg-blue-50/40 border border-blue-200/70 rounded-lg p-3 text-[11px] space-y-2.5">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] mb-0.5">
                  Subject:
                </span>
                <p className="font-bold text-slate-900 bg-white p-2 rounded border border-slate-200 text-xs">
                  {post.draftSubject}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] mb-0.5">
                  Body:
                </span>
                <div className="whitespace-pre-line text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-slate-200 text-xs">
                  {post.draftBody}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={copyDraftToClipboard}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center gap-1"
                >
                  {copiedDraft ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Action Feedback Notice (e.g. in Demo Mode) */}
      {statusMessage && (
        <div className="mb-2 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md animate-in fade-in duration-150">
          ⚠️ {statusMessage}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
        {/* Left: Apply Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {mailtoUrl ? (
            <a
              href={mailtoUrl}
              onClick={handleApplyClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              Apply ({post.applyValue})
            </a>
          ) : post.applyType === "link" && post.applyValue ? (
            <a
              href={post.applyValue}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleApplyClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              🔗 Apply &rarr;
            </a>
          ) : (
            <span className="text-[11px] font-medium text-slate-500 py-1">
              💬 DM on LinkedIn
            </span>
          )}

          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            View post &rarr;
          </a>
        </div>

        {/* Right: Star & Hide */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() =>
              handleStatusToggle(isSaved ? PostStatus.NEW : PostStatus.SAVED)
            }
            disabled={isPending}
            title={isSaved ? "Remove from Starred" : "Save this lead"}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${isSaved
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <span>{isSaved ? "★ Starred" : "☆ Star"}</span>
          </button>

          {!isDismissed ? (
            <button
              onClick={() => handleStatusToggle(PostStatus.DISMISSED)}
              disabled={isPending}
              title="Hide this post"
              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>✕ Hide</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusToggle(PostStatus.NEW)}
              disabled={isPending}
              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <span>Restore</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
