import * as Contracts from "@twf/contracts";
import {
  deleteStorageValue,
  getWebStorage,
  listStorageKeys,
  readStorageValue,
  writeStorageValue,
} from "@/lib/webStorage";

type Role = Contracts.Role;

export type RoomSessionStorage = {
  code: string;
  role: Role;
  name?: string;
};

type StorageCodec<V> = {
  parse: (raw: string) => V | null;
  stringify: (value: V) => string;
};

type StorageVariable<K extends string, V> = {
  name: string;
  keyPattern: string;
  isKey: (key: string) => key is K;
  parse: (raw: string) => V | null;
  stringify: (value: V) => string;
  readonly __types?: {
    key: K;
    value: V;
  };
};

type StorageVariableDefinition<K extends string, V = string> = {
  name: string;
  keyPattern: string;
  isKey: (key: string) => key is K;
  codec?: StorageCodec<V>;
};

const stringCodec: StorageCodec<string> = {
  parse(raw) {
    return raw;
  },
  stringify(value) {
    return value;
  },
};

const booleanCodec: StorageCodec<boolean> = {
  parse(raw) {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  },
  stringify(value) {
    return value ? "true" : "false";
  },
};

const numberCodec: StorageCodec<number> = {
  parse(raw) {
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  },
  stringify(value) {
    return String(value);
  },
};

function createJsonCodec<V>(parseValue: (value: unknown) => V | null) {
  return {
    parse(raw) {
      try {
        return parseValue(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    stringify(value) {
      return JSON.stringify(value);
    },
  } satisfies StorageCodec<V>;
}

function defineStorageVariable<K extends string>(
  variable: StorageVariableDefinition<K>,
): StorageVariable<K, string>;

function defineStorageVariable<K extends string, V>(
  variable: StorageVariableDefinition<K, V>,
): StorageVariable<K, V>;

function defineStorageVariable<K extends string, V>(
  variable: StorageVariableDefinition<K, V>,
): StorageVariable<K, V> {
  const codec = (variable.codec ?? stringCodec) as StorageCodec<V>;
  return {
    name: variable.name,
    keyPattern: variable.keyPattern,
    isKey: variable.isKey,
    parse: codec.parse,
    stringify: codec.stringify,
  };
}

function exactKey<K extends string>(expected: K) {
  return (key: string): key is K => key === expected;
}

function prefixedKey<P extends string>(prefix: P) {
  return (key: string): key is `${P}${string}` => key.startsWith(prefix);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRoomSessionStorage(value: unknown): value is RoomSessionStorage {
  if (!isObject(value)) return false;
  if (typeof value.code !== "string") return false;
  if (typeof value.role !== "string") return false;
  if (value.name != null && typeof value.name !== "string") return false;
  return true;
}

const roomSessionCodec = createJsonCodec((value) =>
  isRoomSessionStorage(value) ? value : null,
);

export const LOCAL_STORAGE_KEYS = {
  CLIENT_ID: "twf:clientId",
  HOST_SESSION: "twf:hostSession",
  HOST_STARTED_ROOM_CODE: "twf:hostStartedRoomCode",
  HOST_LOBBY_GAME_SETTINGS: "twf:hostLobbyGameSettings",
  HOST_LOBBY_PLAY_TIP_SEEN: "twf:hostLobbyPlayTipSeen",
  LANDING_MOBILE_JOIN_TIP_SEEN: "twf:landingMobileJoinTipSeen",
  CREATOR_MESSAGE_SEEN: "twf:creatorMessageSeen",
  USER_REDUCE_MOTION: "twf:userReduceMotion",
  USER_SHOW_TIPS: "twf:userShowTips",
  USER_HIGH_CONTRAST: "twf:userHighContrast",
  USER_STREAMER_MODE: "twf:userStreamerMode",
  USER_SFX_VOLUME: "twf:userSfxVolume",
  PLAYER_ID_PREFIX: "twf:playerId:",
  ROOM_SESSION_PREFIX: "twf:session:",
  PLAYER_ID: (code: string): `twf:playerId:${string}` => `twf:playerId:${code}`,
  ROOM_SESSION: (code: string): `twf:session:${string}` =>
    `twf:session:${code}`,
} as const;

/**
 * Central list of localStorage variables used by the app.
 * Add new entries here first so keys/value types are easy to discover.
 */
const LOCAL_STORAGE_VARIABLES = [
  defineStorageVariable({
    name: "clientId",
    keyPattern: LOCAL_STORAGE_KEYS.CLIENT_ID,
    isKey: exactKey(LOCAL_STORAGE_KEYS.CLIENT_ID),
  }),
  defineStorageVariable({
    name: "hostSession",
    keyPattern: LOCAL_STORAGE_KEYS.HOST_SESSION,
    isKey: exactKey(LOCAL_STORAGE_KEYS.HOST_SESSION),
    codec: roomSessionCodec,
  }),
  defineStorageVariable({
    name: "hostStartedRoomCode",
    keyPattern: LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE,
    isKey: exactKey(LOCAL_STORAGE_KEYS.HOST_STARTED_ROOM_CODE),
  }),
  defineStorageVariable({
    name: "hostLobbyPlayTipSeen",
    keyPattern: LOCAL_STORAGE_KEYS.HOST_LOBBY_PLAY_TIP_SEEN,
    isKey: exactKey(LOCAL_STORAGE_KEYS.HOST_LOBBY_PLAY_TIP_SEEN),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "landingMobileJoinTipSeen",
    keyPattern: LOCAL_STORAGE_KEYS.LANDING_MOBILE_JOIN_TIP_SEEN,
    isKey: exactKey(LOCAL_STORAGE_KEYS.LANDING_MOBILE_JOIN_TIP_SEEN),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "creatorMessageSeen",
    keyPattern: LOCAL_STORAGE_KEYS.CREATOR_MESSAGE_SEEN,
    isKey: exactKey(LOCAL_STORAGE_KEYS.CREATOR_MESSAGE_SEEN),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "userReduceMotion",
    keyPattern: LOCAL_STORAGE_KEYS.USER_REDUCE_MOTION,
    isKey: exactKey(LOCAL_STORAGE_KEYS.USER_REDUCE_MOTION),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "userShowTips",
    keyPattern: LOCAL_STORAGE_KEYS.USER_SHOW_TIPS,
    isKey: exactKey(LOCAL_STORAGE_KEYS.USER_SHOW_TIPS),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "userHighContrast",
    keyPattern: LOCAL_STORAGE_KEYS.USER_HIGH_CONTRAST,
    isKey: exactKey(LOCAL_STORAGE_KEYS.USER_HIGH_CONTRAST),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "userStreamerMode",
    keyPattern: LOCAL_STORAGE_KEYS.USER_STREAMER_MODE,
    isKey: exactKey(LOCAL_STORAGE_KEYS.USER_STREAMER_MODE),
    codec: booleanCodec,
  }),
  defineStorageVariable({
    name: "userSfxVolume",
    keyPattern: LOCAL_STORAGE_KEYS.USER_SFX_VOLUME,
    isKey: exactKey(LOCAL_STORAGE_KEYS.USER_SFX_VOLUME),
    codec: numberCodec,
  }),
  defineStorageVariable({
    name: "playerIdByRoomCode",
    keyPattern: `${LOCAL_STORAGE_KEYS.PLAYER_ID_PREFIX}{roomCode}`,
    isKey: prefixedKey(LOCAL_STORAGE_KEYS.PLAYER_ID_PREFIX),
  }),
  defineStorageVariable({
    name: "roomSessionByRoomCode",
    keyPattern: `${LOCAL_STORAGE_KEYS.ROOM_SESSION_PREFIX}{roomCode}`,
    isKey: prefixedKey(LOCAL_STORAGE_KEYS.ROOM_SESSION_PREFIX),
    codec: roomSessionCodec,
  }),
] as const;

type LocalStorageVariable = (typeof LOCAL_STORAGE_VARIABLES)[number];
type LocalStorageVariableTypeMap = NonNullable<LocalStorageVariable["__types"]>;

export type AppLocalStorageKey = LocalStorageVariableTypeMap["key"];
type AppLocalStorageValue<K extends AppLocalStorageKey> = Extract<
  LocalStorageVariableTypeMap,
  { key: K }
>["value"];

function getVariableForKey(key: string): LocalStorageVariable | null {
  for (const variable of LOCAL_STORAGE_VARIABLES) {
    if (variable.isKey(key)) return variable;
  }
  return null;
}

/** Parses raw localStorage text into its typed value for a known key. */
function parseAppLocalStorageValue<K extends AppLocalStorageKey>(
  key: K,
  raw: string,
): AppLocalStorageValue<K> | null {
  const variable = getVariableForKey(key);
  if (!variable) return null;
  return variable.parse(raw) as AppLocalStorageValue<K> | null;
}

function stringifyAppLocalStorageValue<K extends AppLocalStorageKey>(
  key: K,
  value: AppLocalStorageValue<K>,
): string {
  const variable = getVariableForKey(key);
  if (!variable) return String(value);
  return (variable.stringify as (v: AppLocalStorageValue<K>) => string)(value);
}

/** Safe typed getter for keys in the app schema. */
export function getLocalStorageValue<K extends AppLocalStorageKey>(
  key: K,
): AppLocalStorageValue<K> | null {
  const raw = readStorageValue(getWebStorage("local"), key);
  if (raw == null) return null;

  return parseAppLocalStorageValue(key, raw);
}

/** Safe typed setter for keys in the app schema. */
export function setLocalStorageValue<K extends AppLocalStorageKey>(
  key: K,
  value: AppLocalStorageValue<K>,
) {
  writeStorageValue(
    getWebStorage("local"),
    key,
    stringifyAppLocalStorageValue(key, value),
  );
}

/** Safe typed remove for keys in the app schema. */
export function removeLocalStorageValue(key: AppLocalStorageKey | string) {
  deleteStorageValue(getWebStorage("local"), key);
}

/** Safe key listing for localStorage. */
export function listLocalStorageKeys() {
  return listStorageKeys(getWebStorage("local"));
}
