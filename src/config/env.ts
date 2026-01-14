export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin;

export const IS_DEBUG_ENABLED =
  import.meta.env.VITE_ENABLE_DEBUG_CONTROLS === "true";
