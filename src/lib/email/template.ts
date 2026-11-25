import { Post } from "@prisma/client";

function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 9) {
    return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" }; // emerald
  }
  if (score >= 7) {
    return { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" }; // blue
  }
  return { bg: "#fffbeb", text: "#92400e", border: "#fde68a" }; // amber
}

export interface RawDiscoveredLead {
  url: string;
  snippet: string;
  sourceQuery?: string;
}

export function generateDigestHtml(
  posts: Post[],
  dashboardUrl = "http://localhost:3000",
  otherLeads: RawDiscoveredLead[] = [],
  pipelineErrors: string[] = [],
): string {
  const dateFormatted = new Date().toISOString().split("T")[0];

  const errorsHtml =
    pipelineErrors.length > 0
      ? `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
        <div style="font-size: 14px; font-weight: 800; color: #991b1b; margin-bottom: 6px;">
          🚨 Pipeline Run Failed / Encountered ${pipelineErrors.length} API Error(s)
        </div>
        <p style="font-size: 12px; color: #7f1d1d; margin: 0 0 8px 0;">
          One or more external API calls (SerpApi or Gemini) failed during this run. Here is the exact failure log:
        </p>
        <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #991b1b; line-height: 1.5; font-family: monospace;">
          ${pipelineErrors
            .map(
              (e) =>
                `<li>${e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`,
            )
            .join("")}
        </ul>
      </div>
    `
      : "";

  const cardsHtml = posts
    .map((p) => {
      const scoreColor = getScoreColor(p.fitScore);
      // Build RFC 6068 mailto: URL (uses encodeURIComponent so spaces encode as %20 rather than +)
      const mailtoUrl = (() => {
        if (p.applyType !== "email" || !p.applyValue) return null;
        const subject = p.draftSubject || `Application: ${p.role}`;
        const body = p.draftBody || "";
        const params: string[] = [];
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        return `mailto:${p.applyValue}${params.length ? `?${params.join("&")}` : ""}`;
      })();

      const applyInfo =
        mailtoUrl
          ? `<a href="${mailtoUrl}" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">${p.applyValue}</a>`
          : p.applyType === "link" && p.applyValue
            ? `<a href="${p.applyValue}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">Application Link &rarr;</a>`
            : `<span style="color: #64748b; font-weight: 500;">DM author on LinkedIn</span>`;

      let mailtoButton = "";
      if (mailtoUrl) {
        mailtoButton = `
          <a href="${mailtoUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 7px 12px; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; margin-right: 8px;">
            ✉️ 1-Click Apply (Email)
          </a>
        `;
      }

      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <!-- Top Row: Role, Company & Score Badge -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
            <tr>
              <td valign="top">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #0f172a; font-weight: 700; line-height: 1.3;">
                  ${p.role}
                </h3>
                <div style="font-size: 13px; color: #475569; font-weight: 500;">
                  🏢 <strong style="color: #1e293b;">${p.company}</strong> &bull; 📍 ${p.location} (${p.workMode.toUpperCase()}) &bull; 🎓 ${p.experienceLevel.toUpperCase()}
                </div>
              </td>
              <td width="75" align="right" valign="top">
                <span style="display: inline-block; background-color: ${scoreColor.bg}; color: ${scoreColor.text}; border: 1px solid ${scoreColor.border}; padding: 3px 8px; border-radius: 9999px; font-size: 13px; font-weight: 700;">
                  ★ ${p.fitScore}/10
                </span>
              </td>
            </tr>
          </table>

          <!-- Reason & Match Highlight -->
          <div style="background-color: #f8fafc; border-left: 3px solid #4f46e5; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #334155; margin-bottom: 10px; line-height: 1.5;">
            <strong>Recruiter Match:</strong> ${p.reason}
          </div>

          <!-- Snippet excerpt -->
          <div style="font-size: 12px; color: #64748b; margin-bottom: 12px; line-height: 1.4; max-height: 60px; overflow: hidden;">
            <em>"${p.snippet.slice(0, 200)}..."</em>
          </div>

          <!-- Apply & Actions Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <tr>
              <td valign="middle" style="font-size: 12px; color: #334155;">
                <strong>Apply:</strong> ${applyInfo}
              </td>
              <td align="right" valign="middle">
                ${mailtoButton}
                <a href="${p.url}" target="_blank" style="display: inline-block; background-color: #0a66c2; color: #ffffff; padding: 7px 12px; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                  View LinkedIn Post &rarr;
                </a>
              </td>
            </tr>
          </table>
        </div>
      `;
    })
    .join("");

  // Compact list for other scanned leads (classified as non-relevant or lower score)
  const otherLeadsHtml =
    otherLeads.length > 0
      ? `
      <div style="margin-top: 24px; padding-top: 18px; border-top: 2px dashed #cbd5e1;">
        <div style="margin-bottom: 12px;">
          <h3 style="margin: 0 0 3px 0; font-size: 14px; font-weight: 700; color: #334155;">
            📋 Other Scanned Leads (${otherLeads.length})
          </h3>
          <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
            These were evaluated by AI as low match, student job-seeker posts, or non-hiring promos. Scannable links in case any role was missed:
          </p>
        </div>

        <div style="space-y: 8px;">
          ${otherLeads
            .map(
              (item, idx) => `
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 9px 12px; margin-bottom: 8px;">
              <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 4px;">
                <span style="font-weight: 700; color: #64748b; margin-right: 4px;">#${idx + 1}</span>
                "${item.snippet.slice(0, 150)}${item.snippet.length > 150 ? "..." : ""}"
              </div>
              <div style="font-size: 11px;">
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">
                  Open Post on LinkedIn &rarr;
                </a>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hiring Radar Digest</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #0f172a;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 22px 20px; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                  ⚡ Hiring Radar Daily Digest
                </h1>
                <div style="font-size: 12px; color: #94a3b8;">
                  ${
                    pipelineErrors.length > 0
                      ? `<span style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 1px 6px; border-radius: 4px; font-weight: 700; margin-right: 6px;">FAILED</span>`
                      : ""
                  }
                  <strong style="color: #38bdf8;">${posts.length} relevant match${posts.length === 1 ? "" : "es"}</strong> &bull; ${otherLeads.length} other scanned &bull; ${dateFormatted}
                </div>
              </td>
              <td align="right" valign="middle">
                <a href="${dashboardUrl}" target="_blank" style="background-color: rgba(255,255,255,0.15); color: #ffffff; padding: 6px 12px; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                  Open Dashboard &rarr;
                </a>
              </td>
            </tr>
          </table>
        </div>

        <!-- Content Body -->
        <div style="padding: 20px; background-color: #f8fafc;">
          <!-- Pipeline Errors / Warnings Alert -->
          ${errorsHtml}

          <!-- Section 1: Relevant Matches -->
          ${
            posts.length > 0
              ? cardsHtml
              : `
            <div style="text-align: center; padding: 28px 16px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px;">
              <p style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 6px 0;">No new high-match hiring posts found today.</p>
              <p style="font-size: 12px; color: #64748b; margin: 0;">None of today's new posts passed the match score threshold (${dateFormatted}).</p>
            </div>
          `
          }

          <!-- Section 2: Other Scanned Leads -->
          ${otherLeadsHtml}
        </div>

        <!-- Footer -->
        <div style="background-color: #ffffff; padding: 16px 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
          Hiring Radar &bull; Automated LinkedIn Feed Monitor &bull; Kathmandu &bull; Remote<br/>
          <a href="${dashboardUrl}" style="color: #4f46e5; text-decoration: underline;">Open live dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;
}
