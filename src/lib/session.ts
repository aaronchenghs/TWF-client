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

function createClientId(): string {
  const webCrypto = globalThis.crypto;

  if (typeof webCrypto?.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (typeof webCrypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);

    // RFC 4122 v4: set version and variant bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (value) =>
      value.toString(16).padStart(2, "0"),
    ).join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last-resort fallback for very old browsers.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Generates or retrieves a persistent clientId for this browser/device.
 */
export function getClientId(): string {
  const key = LOCAL_STORAGE_KEYS.CLIENT_ID;
  const existing = getLocalStorageValue(key);
  if (existing) return existing;

  const createdId = createClientId();
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

export function getHostSession(): RoomSession | null {
  return getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION);
}

export function getHostStartedRoomCode(): string | null {
  return getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE);
}

export function markHostStartedRoomCode(code: string) {
  setLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE, code);
}

export function hasSeenHostLobbyPlayTip(): boolean {
  return (
    getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_LOBBY_PLAY_TIP_SEEN) === true
  );
}

export function markHostLobbyPlayTipSeen() {
  setLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_LOBBY_PLAY_TIP_SEEN, true);
}

export function getStartedHostSession(): RoomSession | null {
  const hostSession = getHostSession();
  if (!hostSession) return null;
  const startedRoomCode = getHostStartedRoomCode();
  if (startedRoomCode !== hostSession.code) return null;
  return hostSession;
}

export function clearHostSession() {
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION);
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE);
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
  if (session.role === "host") {
    setLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION, session);
  }
}

/**
 * Clears a saved session for a room.
 */
export function clearRoomSession(code: string) {
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(code));
}

export type RejoinNotice = {
  kind: "player" | "host_lobby" | "host_game";
  roomCode: string;
  createdAt: number;
};

function isRejoinNotice(value: unknown): value is RejoinNotice {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RejoinNotice>;
  if (
    candidate.kind !== "player" &&
    candidate.kind !== "host_lobby" &&
    candidate.kind !== "host_game"
  ) {
    return false;
  }
  if (typeof candidate.roomCode !== "string") return false;
  if (typeof candidate.createdAt !== "number") return false;
  return true;
}

/**
 * Marks a one-time rejoin notice for this browser tab.
 */
export function markPendingRejoinNotice(input: {
  kind: RejoinNotice["kind"];
  roomCode: string;
}) {
  const payload: RejoinNotice = {
    ...input,
    createdAt: Date.now(),
  };
  setSessionStorageValue(
    SESSION_STORAGE_KEYS.REJOIN_NOTICE,
    JSON.stringify(payload),
  );
}

/**
 * Consumes and clears the one-time rejoin notice flag, if present.
 */
export function consumePendingRejoinNotice(): RejoinNotice | null {
  const raw = getSessionStorageValue(SESSION_STORAGE_KEYS.REJOIN_NOTICE);
  if (!raw) return null;

  removeSessionStorageValue(SESSION_STORAGE_KEYS.REJOIN_NOTICE);

  try {
    const parsed: unknown = JSON.parse(raw);
    return isRejoinNotice(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
