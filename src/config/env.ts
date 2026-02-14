export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin;

export const IS_DEBUG_ENABLED =
  import.meta.env.VITE_ENABLE_DEBUG_CONTROLS === "true";

export const APP_VERSION =
  (__APP_VERSION__ ?? "0.0.0").trim();

export const ISSUE_REPORT_FORM_URL =
  (import.meta.env.VITE_ISSUE_REPORT_FORM_URL ?? "").trim();
