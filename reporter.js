/**
 * reporter.js
 * ──────────────────────────────────────────────────────────────────
 * Builds and sends professional, management-friendly crawl reports.
 *
 * Design goals:
 *  - ONE section per website, clean and scannable
 *  - Each broken link appears EXACTLY ONCE, with all source pages grouped under it
 *  - Priority badges: 🟢 Healthy / 🟡 Warning / 🔴 Critical
 *  - Final fleet summary when multiple sites are scanned
 *  - Zero repeated spam / zero raw developer logs in the email
 * ──────────────────────────────────────────────────────────────────
 */

"use strict";

const nodemailer = require("nodemailer");

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABEL = {
  "not-found":    "404 Not Found",
  "soft-404":     "404 Not Found",
  "server-error": "Server Error (5xx)",
  "timeout":      "Timeout / Unreachable",
};

// Priority thresholds (number of unique broken links)
const PRIORITY = {
  HEALTHY:  { label: "🟢 HEALTHY",  max: 0  },
  WARNING:  { label: "🟡 WARNING",  max: 5  },
  CRITICAL: { label: "🔴 CRITICAL", max: Infinity },
};

// Line separators
const SEP_HEAVY = "══════════════════════════════════════════════════════";
const SEP_LIGHT = "──────────────────────────────────────────────────────";

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(cat) {
  return CATEGORY_LABEL[cat] || cat;
}

/**
 * Derives a priority label from the number of unique broken links.
 */
function getPriority(brokenCount) {
  if (brokenCount === 0) return PRIORITY.HEALTHY.label;
  if (brokenCount <= 5)  return PRIORITY.WARNING.label;
  return PRIORITY.CRITICAL.label;
}

/**
 * Returns the raw priority tier for summary counting.
 * @returns {'healthy'|'warning'|'critical'}
 */
function getPriorityTier(brokenCount) {
  if (brokenCount === 0) return "healthy";
  if (brokenCount <= 5)  return "warning";
  return "critical";
}

/**
 * Formats a response time number into a clean string.
 * @param {number|null} ms  Milliseconds, or null if unknown
 */
function fmtTime(ms) {
  if (ms == null) return "N/A";
  return `${ms}ms`;
}

/**
 * Shortens a full URL to a relative path for compact display in "Found on" lists.
 * e.g. https://site.com/en/admissions/  →  /en/admissions/
 */
function toRelativePath(fullUrl) {
  try {
    const u = new URL(fullUrl);
    const path = u.pathname + u.search;
    return path === "/" ? "Homepage" : path;
  } catch {
    return fullUrl;
  }
}

// ── Single-site report block ──────────────────────────────────────────────────

/**
 * Builds the text block for ONE website's report.
 * @param {object} report   CrawlReport from crawler.crawlDomain()
 * @returns {string}
 */
function buildSiteBlock(report) {
  const { rootUrl, pagesScanned, broken, responseTimeMs } = report;

  const totalBroken = broken.length;
  const priority    = getPriority(totalBroken);
  const lines       = [];

  // ── Site header ──────────────────────────────────────────────────────────────
  lines.push(SEP_HEAVY);
  lines.push(rootUrl);
  lines.push(SEP_HEAVY);
  lines.push("");
  lines.push(`Status          : ${priority}`);
  lines.push(`Response Time   : ${fmtTime(responseTimeMs)}`);
  lines.push(`Pages Crawled   : ${pagesScanned}`);
  lines.push(`Broken Links    : ${totalBroken}`);
  lines.push("");

  if (totalBroken === 0) {
    lines.push("✅ All internal links are working correctly.");
    lines.push("");
    return lines.join("\n");
  }

  // ── Broken link details ──────────────────────────────────────────────────────
  broken.forEach((link, idx) => {
    lines.push(SEP_LIGHT);
    lines.push("");

    lines.push(`${idx + 1}. Broken Button Detected`);
    lines.push("");
    lines.push(`   Button Text :`);
    lines.push(`   "${link.text}"`);
    lines.push("");
    lines.push(`   Broken Redirect URL :`);
    lines.push(`   ${link.url}`);
    lines.push("");
    lines.push(`   Error :`);
    lines.push(`   ${categoryLabel(link.category)}`);
    lines.push("");

    const pageCount = link.foundOnPages.length;
    lines.push(`   Button Found On Pages (${pageCount}):`);
    lines.push("");
    link.foundOnPages.forEach((page) => {
      lines.push(`   • ${page}`);
      lines.push("");
    });
  });

  lines.push(SEP_LIGHT);
  lines.push("");

  return lines.join("\n");
}

// ── Fleet summary block ───────────────────────────────────────────────────────

/**
 * Builds the final "Overall Summary" block shown at the top of multi-site emails.
 * @param {object[]} reports   Array of CrawlReport objects
 * @returns {string}
 */
function buildFleetSummary(reports) {
  const counts = { healthy: 0, warning: 0, critical: 0 };
  let totalPages  = 0;
  let totalBroken = 0;

  reports.forEach((r) => {
    const tier = getPriorityTier(r.broken.length);
    counts[tier]++;
    totalPages  += r.pagesScanned;
    totalBroken += r.broken.length;
  });

  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const lines = [];
  lines.push(SEP_HEAVY);
  lines.push("     WEBSITE HEALTH REPORT — OVERALL SUMMARY");
  lines.push(SEP_HEAVY);
  lines.push("");
  lines.push(`Scan Date         : ${now}`);
  lines.push(`Total Sites       : ${reports.length}`);
  lines.push(`Total Pages       : ${totalPages}`);
  lines.push(`Total Broken Links: ${totalBroken}`);
  lines.push("");
  lines.push("Site Status Breakdown:");
  lines.push(`  🟢 Healthy   : ${counts.healthy}`);
  lines.push(`  🟡 Warning   : ${counts.warning}`);
  lines.push(`  🔴 Critical  : ${counts.critical}`);
  lines.push("");
  lines.push(SEP_HEAVY);
  lines.push("");

  return lines.join("\n");
}

// ── Full email body builder ───────────────────────────────────────────────────

/**
 * Builds the full email body for ALL sites in one scan run.
 * @param {object[]} reports  Array of CrawlReport objects
 * @returns {string}
 */
function buildEmailBody(reports) {
  const lines = [];

  // Fleet summary at top (always shown, even for a single site)
  lines.push(buildFleetSummary(reports));

  // Individual site blocks
  reports.forEach((r) => {
    lines.push(buildSiteBlock(r));
  });

  lines.push("─".repeat(54));
  lines.push("This report was generated automatically by WebsiteMonitor.");

  return lines.join("\n");
}

// ── Email subject helper ──────────────────────────────────────────────────────

/**
 * Generates an appropriate email subject line for the batch.
 * @param {object[]} reports
 * @returns {string}
 */
function buildSubject(reports) {
  const criticalCount = reports.filter((r) => getPriorityTier(r.broken.length) === "critical").length;
  const warningCount  = reports.filter((r) => getPriorityTier(r.broken.length) === "warning").length;
  const totalBroken   = reports.reduce((sum, r) => sum + r.broken.length, 0);

  if (totalBroken === 0) {
    return `✅ All Clear — ${reports.length} site${reports.length > 1 ? "s" : ""} fully healthy`;
  }
  if (criticalCount > 0) {
    return `🔴 ${criticalCount} Critical + ${warningCount} Warning — Website Health Report`;
  }
  return `🟡 ${warningCount} Warning${warningCount > 1 ? "s" : ""} — ${totalBroken} broken link${totalBroken > 1 ? "s" : ""} detected`;
}

// ── Transporter ───────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sends ONE combined email for all sites scanned in a single run.
 * Call this once after ALL crawls are complete.
 *
 * @param {object[]} reports  Array of CrawlReport objects from crawler.crawlDomain()
 */
async function sendBatchReport(reports) {
  // Console summary (clean — no per-page noise)
  console.log("\n" + "═".repeat(54));
  console.log("  SCAN COMPLETE — SUMMARY");
  console.log("═".repeat(54));
  reports.forEach((r) => {
    const tier  = getPriorityTier(r.broken.length);
    const badge = tier === "healthy" ? "🟢" : tier === "warning" ? "🟡" : "🔴";
    console.log(`${badge} ${r.rootUrl}`);
    console.log(`   Pages: ${r.pagesScanned}  |  Broken: ${r.broken.length}  |  Time: ${fmtTime(r.responseTimeMs)}`);
    if (r.broken.length > 0) {
      r.broken.forEach((link, i) => {
        console.log(`   ❌ [${i + 1}] ${link.text} → ${link.url}`);
      });
    }
    console.log("");
  });

  const subject = buildSubject(reports);
  const body    = buildEmailBody(reports);

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      process.env.ALERT_EMAILS,
      subject,
      text:    body,
    });
    console.log(`📩 Report emailed — Subject: ${subject}\n`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
}

/**
 * Legacy single-report sender (kept for backward compatibility).
 * Wraps the new batch sender.
 * @param {object} report
 */
async function sendReport(report) {
  await sendBatchReport([report]);
}

module.exports = { sendReport, sendBatchReport, buildEmailBody, buildSiteBlock };
