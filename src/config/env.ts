export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin;

export const IS_DEBUG_ENABLED =
  import.meta.env.VITE_ENABLE_DEBUG_CONTROLS === "true";

export const APP_VERSION =
  (import.meta.env.VITE_APP_VERSION ?? "0.0.0").trim();

export const ISSUES_URL = (import.meta.env.VITE_ISSUES_URL ?? "").trim();

export const ISSUES_API_URL = (
  import.meta.env.VITE_ISSUES_API_URL ?? ""
).trim();
