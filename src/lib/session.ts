import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageValue,
  removeLocalStorageValue,
  setLocalStorageValue,
  type RoomSessionStorage,
} from "./localStorage";
import {
  SESSION_STORAGE_KEYS,
  getSessionStorageValue,
  removeSessionStorageValue,
  setSessionStorageValue,
} from "./sessionStorage";

/**
 * Generates or retrieves a persistent clientId for this browser/device.
 */
export function getClientId(): string {
  const key = LOCAL_STORAGE_KEYS.CLIENT_ID;
  const existing = getLocalStorageValue(key);
  if (existing) return existing;

  const createdId = crypto.randomUUID();
  setLocalStorageValue(key, createdId);
  return createdId;
}

export type RoomSession = RoomSessionStorage;

export function getPlayerId(code: string): string | null {
  return getLocalStorageValue(LOCAL_STORAGE_KEYS.PLAYER_ID(code));
}

export function savePlayerId(code: string, playerId: string) {
  setLocalStorageValue(LOCAL_STORAGE_KEYS.PLAYER_ID(code), playerId);
}

export function clearPlayerId(code: string) {
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.PLAYER_ID(code));
}

/**
 * Returns a saved room session for the given code, if any.
 */
export function getRoomSession(code: string): RoomSession | null {
  return getLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(code));
}

/**
 * Saves or updates the room session for the given code.
 */
export function saveRoomSession(session: RoomSession) {
  setLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(session.code), session);
}

/**
 * Clears a saved session for a room.
 */
export function clearRoomSession(code: string) {
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(code));
}

/**
 * Marks a one-time rejoin notice for this browser tab.
 */
export function markPendingRejoinNotice() {
  setSessionStorageValue(SESSION_STORAGE_KEYS.REJOIN_NOTICE, "1");
}

/**
 * Consumes and clears the one-time rejoin notice flag, if present.
 */
export function consumePendingRejoinNotice(): boolean {
  const exists =
    getSessionStorageValue(SESSION_STORAGE_KEYS.REJOIN_NOTICE) === "1";
  if (exists) removeSessionStorageValue(SESSION_STORAGE_KEYS.REJOIN_NOTICE);
  return exists;
}
