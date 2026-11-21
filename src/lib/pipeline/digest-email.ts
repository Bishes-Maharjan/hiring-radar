import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { getConfig } from "./config";
import { getPostsForEmailDigest, markPostsAsEmailed } from "../db/repository";
import { generateDigestHtml, RawDiscoveredLead } from "../email/template";

export interface DigestEmailResult {
  emailSent: boolean;
  matchCount: number;
  otherLeadCount?: number;
  error?: string;
  previewPath?: string;
}

/**
 * Creates a Nodemailer transport using Gmail App Password.
 */
function createEmailTransport(user: string, pass: string) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Orchestrates querying eligible matches, generating the HTML digest,
 * and dispatching via Gmail SMTP or previewing in DRY_RUN mode.
 */
export async function sendDailyDigest(
  otherLeads: RawDiscoveredLead[] = [],
): Promise<DigestEmailResult> {
  const config = getConfig();
  const dateFormatted = new Date().toISOString().split("T")[0];

  // 1. Fetch un-emailed posts with score >= MIN_SCORE
  const matches = await getPostsForEmailDigest(config.MIN_SCORE);
  console.log(
    `📬 Email digest query: found ${matches.length} eligible posts (fitScore >= ${config.MIN_SCORE}, un-emailed), and ${otherLeads.length} other scanned leads.`,
  );

  if (matches.length === 0 && otherLeads.length === 0 && !config.ALWAYS_SEND) {
    console.log(
      "ℹ️ No new matches or scanned leads to email today and ALWAYS_SEND=false. Skipping email.",
    );
    return {
      emailSent: false,
      matchCount: 0,
      otherLeadCount: 0,
    };
  }

  // 2. Generate HTML email content
  const html = generateDigestHtml(matches, config.NEXT_PUBLIC_APP_URL, otherLeads);
  const subject =
    matches.length > 0
      ? `Hiring Radar: ${matches.length} match${matches.length === 1 ? "" : "es"} (${otherLeads.length} other scanned) - ${dateFormatted}`
      : `Hiring Radar: 0 top matches (${otherLeads.length} leads scanned) - ${dateFormatted}`;

  // 3. Handle DRY_RUN mode: save to out/preview.html
  if (config.DRY_RUN) {
    const outDir = path.resolve(process.cwd(), "out");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const previewFile = path.join(outDir, "preview.html");
    fs.writeFileSync(previewFile, html, "utf-8");
    console.log(`🧪 DRY_RUN active: Email HTML saved to ${previewFile}`);

    // Mark as emailed if matches exist
    if (matches.length > 0) {
      await markPostsAsEmailed(matches.map((m) => m.id));
    }

    return {
      emailSent: true,
      matchCount: matches.length,
      otherLeadCount: otherLeads.length,
      previewPath: previewFile,
    };
  }

  // 4. Live email dispatch via Nodemailer
  if (!config.SMTP_USER || !config.SMTP_PASS) {
    console.warn(
      "⚠️ SMTP_USER or SMTP_PASS is missing in environment. Cannot send email digest.",
    );
    return {
      emailSent: false,
      matchCount: matches.length,
      otherLeadCount: otherLeads.length,
      error: "SMTP credentials not configured",
    };
  }

  try {
    const transporter = createEmailTransport(
      config.SMTP_USER,
      config.SMTP_PASS,
    );

    console.log(`📧 Sending daily digest to ${config.MAIL_TO}...`);
    const info = await transporter.sendMail({
      from: config.MAIL_FROM,
      to: config.MAIL_TO,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);

    // Mark posts as emailed in database
    if (matches.length > 0) {
      await markPostsAsEmailed(matches.map((m) => m.id));
    }

    return {
      emailSent: true,
      matchCount: matches.length,
      otherLeadCount: otherLeads.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to send digest email:", message);
    return {
      emailSent: false,
      matchCount: matches.length,
      otherLeadCount: otherLeads.length,
      error: message,
    };
  }
}
