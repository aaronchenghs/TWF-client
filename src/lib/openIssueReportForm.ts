import { ISSUE_REPORT_FORM_URL } from "@/config/env";

export function openIssueReportForm() {
  if (!ISSUE_REPORT_FORM_URL) {
    console.error("VITE_ISSUE_REPORT_FORM_URL is not configured.");
    return;
  }

  try {
    const url = new URL(ISSUE_REPORT_FORM_URL);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch {
    console.error(
      "VITE_ISSUE_REPORT_FORM_URL is invalid:",
      ISSUE_REPORT_FORM_URL,
    );
  }
}
