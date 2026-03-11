import * as Contracts from "@twf/contracts";
import { normalizeCode } from "@/lib/stringNormalizers";
import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageValue,
  listLocalStorageKeys,
  removeLocalStorageValue,
  setLocalStorageValue,
  type RoomSessionStorage,
} from "@/lib/localStorage";
import {
  SESSION_STORAGE_KEYS,
  getSessionStorageValue,
  removeSessionStorageValue,
  setSessionStorageValue,
} from "@/lib/sessionStorage";
const CODE_LENGTH = Contracts.CODE_LENGTH;

/**
 * Storage tokens used by this module (keys in local/session storage):
 * - HOST_SESSION: source of truth for which room the host currently owns.
 *   Used so host routes can reconnect without exposing room code in the URL.
 *
 * - HOST_STARTED_ROOM_CODE: proof that the host has already started the game.
 *   Used to route host back into game flow after refresh/reopen.
 *
 * - ROOM_SESSION(code): role/name snapshot for a room.
 *   Used to recover player/host session context when routes mount.
 *
 * - PLAYER_ID(code): server-assigned player identity in that room.
 *   Used to map the client back to the same player entity after reconnect.
 *
 * - ACTIVE_PLAYER_ROOM_CODE: tab-scoped "current player room" pointer.
 *   Used to decide which room session should be treated as active right now.
 */

/**
 * Internal helper: normalize and validate room codes used by this module.
 */
function asValidRoomCode(code: string): string | null {
  const normalizedCode = normalizeCode(code);
  return normalizedCode.length === CODE_LENGTH ? normalizedCode : null;
}

function getRoomCodeFromScopedStorageKey(prefix: string, key: string) {
  if (!key.startsWith(prefix)) return null;
  return asValidRoomCode(key.slice(prefix.length));
}

function collectRetainedRoomState() {
  const roomSessionCodes = new Set<string>();
  const playerIdCodes = new Set<string>();

  const hostSession = getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION);
  const hostRoomCode = asValidRoomCode(hostSession?.code ?? "");
  if (hostRoomCode) roomSessionCodes.add(hostRoomCode);

  const activePlayerRoomCode = asValidRoomCode(
    getSessionStorageValue(SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE) ?? "",
  );

  if (activePlayerRoomCode) {
    const activePlayerSession = getLocalStorageValue(
      LOCAL_STORAGE_KEYS.ROOM_SESSION(activePlayerRoomCode),
    );

    if (activePlayerSession?.role === "player") {
      roomSessionCodes.add(activePlayerRoomCode);
      playerIdCodes.add(activePlayerRoomCode);
    } else {
      removeSessionStorageValue(SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE);
    }
  }

  return { roomSessionCodes, playerIdCodes, hostRoomCode };
}

/**
 * Removes stale room-scoped localStorage entries once a new player identity
 * has been established, preserving only the currently referenced host room
 * and active player room state.
 */
function cleanupPersistedRoomState() {
  const { roomSessionCodes, playerIdCodes, hostRoomCode } =
    collectRetainedRoomState();

  const startedHostRoomCode = asValidRoomCode(
    getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE) ?? "",
  );

  if (startedHostRoomCode && startedHostRoomCode !== hostRoomCode)
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE);

  for (const key of listLocalStorageKeys()) {
    const roomSessionCode = getRoomCodeFromScopedStorageKey(
      LOCAL_STORAGE_KEYS.ROOM_SESSION_PREFIX,
      key,
    );
    if (roomSessionCode && !roomSessionCodes.has(roomSessionCode)) {
      removeLocalStorageValue(key);
      continue;
    }

    const playerIdCode = getRoomCodeFromScopedStorageKey(
      LOCAL_STORAGE_KEYS.PLAYER_ID_PREFIX,
      key,
    );

    if (playerIdCode && !playerIdCodes.has(playerIdCode))
      removeLocalStorageValue(key);
  }
}

/**
 * Host room state: Reads the host room code from persisted host session.
 */
export function readHostRoomCode() {
  const hostSession = getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION);
  return asValidRoomCode(hostSession?.code ?? "") ?? "";
}

/**
 * Host room state: Marks that the host has started the game for a room.
 */
export function markHostRoomStarted(roomCode: string) {
  const normalizedCode = asValidRoomCode(roomCode);
  if (!normalizedCode) return;
  setLocalStorageValue(
    LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE,
    normalizedCode,
  );
}

/**
 * Host room state: Clears host-specific persisted room data.
 */
export function clearHostRoomState(roomCode: string) {
  const normalizedCode = asValidRoomCode(roomCode);
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_SESSION);
  removeLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE);
  if (normalizedCode)
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(normalizedCode));
}

/**
 * Player session state: Reads the active player session from persisted storage.
 */
export function readActivePlayerSession(): RoomSessionStorage | null {
  const activeRoomCode = getSessionStorageValue(
    SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE,
  );
  if (!activeRoomCode) return null;

  const normalizedCode = asValidRoomCode(activeRoomCode);
  if (!normalizedCode) return null;

  const session = getLocalStorageValue(
    LOCAL_STORAGE_KEYS.ROOM_SESSION(normalizedCode),
  );
  if (!session || session.role !== "player") return null;

  return session;
}

/**
 * Player runtime state: Reads player identity and active room marker for the current room context.
 */
export function readPlayerRuntime(roomCode: string) {
  const normalizedCode = asValidRoomCode(roomCode);
  const activeRoomCode = asValidRoomCode(
    getSessionStorageValue(SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE) ?? "",
  );

  const playerId = normalizedCode
    ? getLocalStorageValue(LOCAL_STORAGE_KEYS.PLAYER_ID(normalizedCode))
    : null;

  return { playerId, activeRoomCode };
}

/**
 * Player session state: Persists the minimum data needed to restore a player's
 * room context after refresh, accidental tab close, or route re-entry.
 *
 * What this writes:
 * - `ROOM_SESSION(code)` in localStorage:
 *   stores the room code, `player` role, and the latest known player name so
 *   the app can recover "which room was I in?" across browser restarts.
 *
 * - `PLAYER_ID(code)` in localStorage, when available:
 *   stores the server-assigned player identity for that room. This is what
 *   lets the client rejoin as the same player entity instead of creating a new
 *   one on reconnect.
 *
 * - `ACTIVE_PLAYER_ROOM_CODE` in sessionStorage:
 *   marks which player room should be treated as active in the current tab.
 *   This is intentionally tab-scoped so one browser can still have separate
 *   tabs pointed at different rooms without making every stored player session
 *   globally active.
 *
 * Why `playerId` is optional:
 * - Some call sites know the player name/room immediately but do not yet have
 *   the canonical server-issued `playerId`.
 * - In that case we still persist enough context to navigate back into the
 *   player flow, then upgrade the stored state later once the server returns a
 *   stable identity.
 *
 * Why cleanup only runs when `playerId` exists:
 * - Old room-scoped keys are pruned only after a new player identity has been
 *   confirmed. That avoids deleting the last-known room too early in cases
 *   where the user is trying to recover from an accidental close and still
 *   needs the previous session metadata to rejoin successfully.
 */
export function persistPlayerJoinState(input: {
  roomCode: string;
  name: string;
  playerId?: string | null;
}) {
  const normalizedCode = asValidRoomCode(input.roomCode);
  if (!normalizedCode) return;

  setLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(normalizedCode), {
    code: normalizedCode,
    role: "player",
    name: input.name,
  });

  if (input.playerId)
    setLocalStorageValue(
      LOCAL_STORAGE_KEYS.PLAYER_ID(normalizedCode),
      input.playerId,
    );

  setSessionStorageValue(
    SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE,
    normalizedCode,
  );

  if (input.playerId) cleanupPersistedRoomState();
}

/**
 * Player session state: Clears player session and identity for a room and clears active marker when appropriate.
 */
export function clearPlayerRoomState(roomCode: string) {
  const normalizedCode = asValidRoomCode(roomCode);
  const activeRoomCode = asValidRoomCode(
    getSessionStorageValue(SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE) ?? "",
  );

  if (normalizedCode) {
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.ROOM_SESSION(normalizedCode));
    removeLocalStorageValue(LOCAL_STORAGE_KEYS.PLAYER_ID(normalizedCode));
  }

  if (!normalizedCode || !activeRoomCode || activeRoomCode === normalizedCode)
    removeSessionStorageValue(SESSION_STORAGE_KEYS.ACTIVE_PLAYER_ROOM_CODE);
}
