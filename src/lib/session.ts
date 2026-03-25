import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageValue,
  setLocalStorageValue,
  type RoomSessionStorage,
} from "./localStorage";

function createClientId(): string {
  const webCrypto = globalThis.crypto;

  if (typeof webCrypto?.randomUUID === "function")
    return webCrypto.randomUUID();

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

export function getStartedHostSession(): RoomSessionStorage | null {
  const hostSession = getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION);
  if (!hostSession) return null;
  const startedRoomCode = getLocalStorageValue(
    LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE,
  );
  if (startedRoomCode !== hostSession.code) return null;
  return hostSession;
}

/**
 * Saves or updates the room session for the given code.
 */
export function saveRoomSession(session: RoomSessionStorage) {
  setLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(session.code), session);
  if (session.role === "host")
    setLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION, session);
}
