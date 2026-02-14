import { APP_VERSION, ISSUES_API_URL, ISSUES_URL } from "@/config/env";

type IssueReportContext = {
  summary?: string;
  details?: string;
};

function buildIssueBody({ details }: IssueReportContext): string {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const detailsText = details?.trim() ?? "";

  return [
    "## What happened?",
    "",
    detailsText || "Describe the bug you hit.",
    "",
    "## Expected behavior",
    "",
    "What should have happened instead.",
    "",
    "## Steps to reproduce",
    "",
    "1. ...",
    "2. ...",
    "3. ...",
    "",
    "## Context",
    `- App version: ${APP_VERSION}`,
    `- Route: ${path}`,
    `- Browser: ${navigator.userAgent}`,
    `- Timestamp: ${new Date().toISOString()}`,
  ].join("\n");
}

export async function submitIssueReport(
  context: IssueReportContext,
): Promise<void> {
  const summary = context.summary?.trim() ?? "";
  const subject = summary ? `[Bug] ${summary}` : "[Bug] Issue Report";
  const body = buildIssueBody(context);

  if (!ISSUES_API_URL) {
    throw new Error("VITE_ISSUES_API_URL is not configured.");
  }

  const response = await fetch(ISSUES_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: subject,
      body,
      labels: ["user-submitted"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit issue (${response.status})`);
  }
}

export function openIssueReport(context: IssueReportContext) {
  const summary = context.summary?.trim() ?? "";
  const subject = summary ? `[Bug] ${summary}` : "[Bug] Issue Report";
  const body = buildIssueBody(context);

  if (!ISSUES_URL) {
    console.error("VITE_ISSUES_URL is not configured.");
    return;
  }

  try {
    const url = new URL(ISSUES_URL);
    if (!url.searchParams.has("title")) {
      url.searchParams.set("title", subject);
    }
    if (!url.searchParams.has("body")) {
      url.searchParams.set("body", body);
    }
    if (!url.searchParams.has("labels")) {
      url.searchParams.set("labels", "user-submitted");
    }

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch {
    console.error("VITE_ISSUES_URL is invalid:", ISSUES_URL);
  }
}
