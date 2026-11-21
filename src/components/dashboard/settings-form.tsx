"use client";

import { useActionState, useState } from "react";
import { Settings } from "@prisma/client";
import { updateSettingsAction } from "@/app/actions/settings";

interface SettingsFormProps {
  settings: Settings;
  isDemo?: boolean;
}

export function SettingsForm({ settings, isDemo }: SettingsFormProps) {
  const [feedback, setFeedback] = useState<{
    type: "error" | "info" | "success";
    message: string;
  } | null>(null);

  const [, formAction, isPending] = useActionState(
    async (_prev: null, formData: FormData) => {
      setFeedback(null);
      if (isDemo) {
        setFeedback({
          type: "info",
          message: "Disabled in the demo: settings cannot be modified in public showcase mode.",
        });
        return null;
      }
      try {
        await updateSettingsAction(formData);
        setFeedback({
          type: "success",
          message: "✓ Settings updated successfully.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isDemoErr = msg.includes("demo mode") || msg.includes("DemoModeError");
        setFeedback({
          type: isDemoErr ? "info" : "error",
          message: isDemoErr
            ? "Disabled in the demo: settings cannot be modified in public showcase mode."
            : `Failed to update settings: ${msg}`,
        });
      }
      return null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Identity */}
      <fieldset className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Contact Information
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Full Name"
            name="fullName"
            defaultValue={settings.fullName}
            disabled={isDemo}
            required
          />
          <Field
            label="Email Address"
            name="email"
            type="email"
            defaultValue={settings.email}
            disabled={isDemo}
            required
          />
          <Field
            label="Phone Number"
            name="phone"
            defaultValue={settings.phone}
            disabled={isDemo}
          />
          <Field
            label="Location"
            name="location"
            defaultValue={settings.location}
            disabled={isDemo}
          />
        </div>
      </fieldset>

      {/* Professional */}
      <fieldset className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Professional Profile
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Education"
            name="education"
            defaultValue={settings.education}
            disabled={isDemo}
          />
          <Field
            label="Seeking Roles"
            name="seeking"
            defaultValue={settings.seeking}
            disabled={isDemo}
          />
        </div>
      </fieldset>

      {/* Links */}
      <fieldset className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Links
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="GitHub URL"
            name="githubUrl"
            defaultValue={settings.githubUrl}
            disabled={isDemo}
          />
          <Field
            label="LinkedIn URL"
            name="linkedinUrl"
            defaultValue={settings.linkedinUrl}
            disabled={isDemo}
          />
          <div className="sm:col-span-2">
            <Field
              label="Portfolio URL"
              name="portfolioUrl"
              defaultValue={settings.portfolioUrl ?? ""}
              disabled={isDemo}
              hint="Leave blank if you don't have one yet. When set, the AI will include it in email drafts."
            />
          </div>
        </div>
      </fieldset>

      {/* Bio / Description */}
      <fieldset className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Experience & Projects
        </legend>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Personal Description & Experience
          </label>
          <textarea
            name="personalDescription"
            defaultValue={settings.personalDescription}
            disabled={isDemo}
            rows={10}
            className={`w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y leading-relaxed ${
              isDemo ? "cursor-not-allowed opacity-80" : ""
            }`}
            placeholder="Your core stack, work experience, projects, and what roles each project is best suited for..."
          />
          <p className="text-[10px] text-slate-400 mt-1">
            This is injected as the &lt;candidate_profile&gt; in every Gemini
            classification call.
          </p>
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isDemo}
          title={isDemo ? "Settings cannot be saved in demo mode" : undefined}
          className={`px-5 py-2 text-xs font-bold rounded-lg text-white transition-colors shadow-xs ${
            isDemo
              ? "bg-slate-400 cursor-not-allowed opacity-75"
              : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
          }`}
        >
          {isDemo ? "Save Settings (Disabled in Demo)" : isPending ? "Saving..." : "Save Settings"}
        </button>

        {feedback && (
          <span
            className={`text-xs px-3 py-1.5 rounded-lg border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : feedback.type === "info"
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  );
}

// Reusable form field
function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        {required && !disabled && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required && !disabled}
        disabled={disabled}
        className={`w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
          disabled ? "cursor-not-allowed opacity-80" : ""
        }`}
      />
      {hint && (
        <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
      )}
    </div>
  );
}
