import type { Role } from "@twf/contracts";

const KEY_CLIENT_ID = "twf:clientId";

/**
 * Generates or retrieves a persistent clientId for this browser/device.
 */
export function getClientId(): string {
  const existing = localStorage.getItem(KEY_CLIENT_ID);
  if (existing) return existing;

  const createdId = crypto.randomUUID();
  localStorage.setItem(KEY_CLIENT_ID, createdId);
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

/**
 * Returns a saved room session for the given code, if any.
 */
export function getRoomSession(code: string): RoomSession | null {
  const raw = localStorage.getItem(sessionKey(code));
  return raw ? (JSON.parse(raw) as RoomSession) : null;
}

/**
 * Saves or updates the room session for the given code.
 */
export function saveRoomSession(session: RoomSession) {
  localStorage.setItem(sessionKey(session.code), JSON.stringify(session));
}

/**
 * Clears a saved session for a room.
 */
export function clearRoomSession(code: string) {
  localStorage.removeItem(sessionKey(code));
}
