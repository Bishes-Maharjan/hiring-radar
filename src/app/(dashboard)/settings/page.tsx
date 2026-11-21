import { connection } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { getSettings } from "@/lib/db/repository";
import { isDemoMode } from "@/lib/auth/demo";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  await requireAuth();
  const inDemo = isDemoMode();
  const dbSettings = await getSettings();

  // In demo mode, NEVER display real profile data, keys, or emails from database
  const settings = inDemo
    ? {
        id: "default",
        fullName: "Demo Candidate (Public Profile)",
        email: "candidate@example.com",
        phone: "+977 9800000000",
        location: "Kathmandu, Nepal",
        education: "BCA / Computer Science, Demo University",
        seeking: "Junior Backend and AI Engineering Roles",
        githubUrl: "github.com/example-demo",
        linkedinUrl: "linkedin.com/in/demo-candidate",
        portfolioUrl: "https://demo.example.com",
        personalDescription: `[DEMO SHOWCASE: Profile details are masked for public showcase demonstration.]

Core Stack: TypeScript, Node.js, Next.js, Python, PostgreSQL, Prisma, Pinecone RAG.
Specializes in building robust APIs, background workers, and AI workflow automations.`,
        updatedAt: new Date(),
      }
    : dbSettings;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Profile & Settings</span>
          {inDemo && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              Demo Read-Only
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {inDemo
            ? "Displaying synthetic demonstration profile. Form inputs and settings saving are disabled in demo mode."
            : "Your details are injected into the AI system prompt for tailored email drafts."}
        </p>
      </div>

      <SettingsForm settings={settings} isDemo={inDemo} />
    </div>
  );
}
