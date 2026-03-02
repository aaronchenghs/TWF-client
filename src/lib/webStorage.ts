type StorageKind = "local" | "session";

export function getWebStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorageValue(
  storage: Storage | null,
  key: string,
): string | null {
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageValue(
  storage: Storage | null,
  key: string,
  value: string,
) {
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    return;
  }
}

export function deleteStorageValue(storage: Storage | null, key: string) {
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}
