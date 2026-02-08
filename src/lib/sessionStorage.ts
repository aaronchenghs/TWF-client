export const SESSION_STORAGE_KEYS = {
  REJOIN_NOTICE: "twf:rejoinNotice",
} as const;

export type AppSessionStorageKey =
  (typeof SESSION_STORAGE_KEYS)[keyof typeof SESSION_STORAGE_KEYS];

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Safe getter for known sessionStorage keys. */
export function getSessionStorageValue(
  key: AppSessionStorageKey,
): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Safe setter for known sessionStorage keys. */
export function setSessionStorageValue(
  key: AppSessionStorageKey,
  value: string,
) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    return;
  }
}

/** Safe remove for known sessionStorage keys. */
export function removeSessionStorageValue(key: AppSessionStorageKey) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}
