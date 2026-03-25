import {
  deleteStorageValue,
  getWebStorage,
  readStorageValue,
  writeStorageValue,
} from "@/lib/webStorage";

export const SESSION_STORAGE_KEYS = {
  ACTIVE_PLAYER_ROOM_CODE: "twf:activePlayerRoomCode",
} as const;

type AppSessionStorageKey =
  (typeof SESSION_STORAGE_KEYS)[keyof typeof SESSION_STORAGE_KEYS];

/** Safe getter for known sessionStorage keys. */
export function getSessionStorageValue(
  key: AppSessionStorageKey,
): string | null {
  return readStorageValue(getWebStorage("session"), key);
}

/** Safe setter for known sessionStorage keys. */
export function setSessionStorageValue(
  key: AppSessionStorageKey,
  value: string,
) {
  writeStorageValue(getWebStorage("session"), key, value);
}

/** Safe remove for known sessionStorage keys. */
export function removeSessionStorageValue(key: AppSessionStorageKey) {
  deleteStorageValue(getWebStorage("session"), key);
}
