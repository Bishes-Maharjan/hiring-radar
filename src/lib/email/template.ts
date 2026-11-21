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

export function generateDigestHtml(
  posts: Post[],
  dashboardUrl = "http://localhost:3000",
): string {
  const dateFormatted = new Date().toISOString().split("T")[0];

  const cardsHtml = posts
    .map((p) => {
      const scoreColor = getScoreColor(p.fitScore);
      // Build RFC 6068 mailto: URL (uses encodeURIComponent so spaces encode as %20 rather than +)
      const mailtoUrl = (() => {
        if (p.applyType !== "email" || !p.applyValue) return null;
        const subject =
          p.draftSubject || `Application: ${p.role}`;
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
          <a href="${mailtoUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 8px 14px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; margin-right: 8px;">
            ✉️ 1-Click Apply (Email)
          </a>
        `;
      }

      return `
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Top Row: Role, Company & Score Badge -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
            <tr>
              <td valign="top">
                <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #111827; font-weight: 700; line-height: 1.3;">
                  ${p.role}
                </h3>
                <div style="font-size: 14px; color: #4b5563; font-weight: 500;">
                  🏢 <strong style="color: #1f2937;">${p.company}</strong> &bull; 📍 ${p.location} (${p.workMode.toUpperCase()}) &bull; 🎓 ${p.experienceLevel.toUpperCase()}
                </div>
              </td>
              <td width="70" align="right" valign="top">
                <span style="display: inline-block; background-color: ${scoreColor.bg}; color: ${scoreColor.text}; border: 1px solid ${scoreColor.border}; padding: 4px 10px; border-radius: 9999px; font-size: 14px; font-weight: 700;">
                  ★ ${p.fitScore}/10
                </span>
              </td>
            </tr>
          </table>

          <!-- Reason & Match Highlight -->
          <div style="background-color: #f9fafb; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 4px; font-size: 13px; color: #374151; margin-bottom: 12px; line-height: 1.5;">
            <strong>Recruiter Match:</strong> ${p.reason}
          </div>

          <!-- Snippet excerpt -->
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 14px; line-height: 1.4; max-height: 70px; overflow: hidden;">
            <em>"${p.snippet.slice(0, 220)}..."</em>
          </div>

          <!-- Apply & Actions Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #f3f4f6; padding-top: 14px;">
            <tr>
              <td valign="middle" style="font-size: 13px; color: #374151;">
                <strong>Contact / Apply:</strong> ${applyInfo}
              </td>
              <td align="right" valign="middle">
                ${mailtoButton}
                <a href="${p.url}" target="_blank" style="display: inline-block; background-color: #0a66c2; color: #ffffff; padding: 8px 14px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                  View LinkedIn Post &rarr;
                </a>
              </td>
            </tr>
          </table>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hiring Radar Digest</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #111827;">
      <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 24px; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                  ⚡ Hiring Radar Daily Digest
                </h1>
                <div style="font-size: 14px; color: #94a3b8;">
                  ${posts.length} new curated match${posts.length === 1 ? "" : "es"} found for you &bull; ${dateFormatted}
                </div>
              </td>
              <td align="right" valign="middle">
                <a href="${dashboardUrl}" target="_blank" style="background-color: rgba(255,255,255,0.15); color: #ffffff; padding: 8px 14px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
                  Open Dashboard &rarr;
                </a>
              </td>
            </tr>
          </table>
        </div>

        <!-- Content Body -->
        <div style="padding: 24px; background-color: #f9fafb;">
          ${
            posts.length > 0
              ? cardsHtml
              : `
            <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
              <p style="font-size: 16px; margin: 0 0 8px 0;">No new high-match hiring posts found today.</p>
              <p style="font-size: 13px; margin: 0;">We will keep monitoring LinkedIn feed posts daily at 07:00 NPT.</p>
            </div>
          `
          }
        </div>

        <!-- Footer -->
        <div style="background-color: #ffffff; padding: 20px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; line-height: 1.5;">
          Hiring Radar &bull; Automated LinkedIn Feed Monitor &bull; Kathmandu, Nepal<br/>
          <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: underline;">Access full dashboard and filters</a>
        </div>
      </div>
    </body>
    </html>
  `;
}
