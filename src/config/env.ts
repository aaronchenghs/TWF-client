function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function resolveRuntimeUrl(rawUrl: string | undefined): string {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const runtimeHost = window.location.hostname;

    if (isLoopbackHost(parsed.hostname) && !isLoopbackHost(runtimeHost))
      parsed.hostname = runtimeHost;

    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export const SOCKET_URL =
  resolveRuntimeUrl(import.meta.env.VITE_SOCKET_URL) || window.location.origin;

export const IS_DEBUG_ENABLED =
  import.meta.env.VITE_ENABLE_DEBUG_CONTROLS === "true";

export const APP_VERSION = (__APP_VERSION__ ?? "0.0.0").trim();

export const ISSUE_REPORT_FORM_URL = (
  import.meta.env.VITE_ISSUE_REPORT_FORM_URL ?? ""
).trim();

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL ?? "").trim() || window.location.origin;
