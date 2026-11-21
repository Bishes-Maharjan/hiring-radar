"use client";

import { useState, useTransition } from "react";
import { triggerManualRun } from "@/app/actions/run";

interface RunNowButtonProps {
  isDemo?: boolean;
}

export function RunNowButton({ isDemo }: RunNowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleRun = () => {
    if (isDemo) {
      setFeedback({
        type: "info",
        message: "Disabled in the demo: pipeline execution and quota spending are disabled.",
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await triggerManualRun();
        if (result.error) {
          setFeedback({
            type: "error",
            message: `Pipeline encountered an error: ${result.error}`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `✓ Pipeline complete: ${result.newPosts} posts evaluated, ${result.hiringPosts} genuine hiring matches discovered.`,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isDemoErr = msg.includes("demo mode") || msg.includes("DemoModeError");

        setFeedback({
          type: isDemoErr ? "info" : "error",
          message: isDemoErr
            ? "Disabled in the demo: pipeline execution is disabled in public demo mode."
            : `Failed to trigger pipeline: ${msg}`,
        });
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <button
        onClick={handleRun}
        disabled={isPending || isDemo}
        title={
          isDemo
            ? "Disabled in the demo: pipeline runs cannot be triggered in showcase mode"
            : "Trigger an immediate search and classification run"
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors shrink-0 shadow-xs ${
          isDemo
            ? "bg-slate-400 cursor-not-allowed opacity-75"
            : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
        }`}
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Running...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>{isDemo ? "Run Pipeline (Disabled in Demo)" : "Run Pipeline Now"}</span>
          </>
        )}
      </button>

      {feedback && (
        <div
          className={`text-[11px] px-2.5 py-1 rounded-md border animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : feedback.type === "info"
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
