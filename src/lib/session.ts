import * as Contracts from "@twf/contracts";
type Role = Contracts.Role;

const KEY_CLIENT_ID = "twf:clientId";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeGetItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    return;
  }
}

function safeRemoveItem(key: string) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}

/**
 * Generates or retrieves a persistent clientId for this browser/device.
 */
export function getClientId(): string {
  const existing = safeGetItem(KEY_CLIENT_ID);
  if (existing) return existing;

  const createdId = crypto.randomUUID();
  safeSetItem(KEY_CLIENT_ID, createdId);
  return createdId;
}

type RoomSession = {
  code: string;
  role: Role;
  name?: string;
};

function sessionKey(code: string) {
  return `twf:session:${code}`;
}

function playerIdKey(code: string) {
  return `twf:playerId:${code}`;
}

export function getPlayerId(code: string): string | null {
  return safeGetItem(playerIdKey(code));
}

export function savePlayerId(code: string, playerId: string) {
  safeSetItem(playerIdKey(code), playerId);
}

export function clearPlayerId(code: string) {
  safeRemoveItem(playerIdKey(code));
}

/**
 * Returns a saved room session for the given code, if any.
 */
export function getRoomSession(code: string): RoomSession | null {
  const raw = safeGetItem(sessionKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}

/**
 * Saves or updates the room session for the given code.
 */
export function saveRoomSession(session: RoomSession) {
  safeSetItem(sessionKey(session.code), JSON.stringify(session));
}

/**
 * Clears a saved session for a room.
 */
export function clearRoomSession(code: string) {
  safeRemoveItem(sessionKey(code));
}
