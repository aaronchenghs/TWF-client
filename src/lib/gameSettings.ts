import { isObject } from "radashi";
import type { RoomPublicState } from "@twf/contracts";
import { LOCAL_STORAGE_KEYS } from "@/lib/localStorage";
import {
  getWebStorage,
  readStorageValue,
  writeStorageValue,
} from "@/lib/webStorage";

/**
 * Adding a new custom game setting:
 * 1. Add the new key to DEFAULT_GAME_SETTINGS so it becomes part of the
 *    canonical settings shape and automatic normalization/equality checks.
 * 2. If it should appear as a toggle in the Host Lobby modal, add an entry to
 *    GAME_SETTING_TOGGLE_DEFINITIONS with its UI copy.
 * 3. If the new setting needs a different control type later, keep the storage
 *    helpers here and add the new UI control in the Host Lobby settings feature.
 */
export type GameSettings = RoomPublicState["gameSettings"];
type GameSettingKey = keyof GameSettings;
type StoredGameSettingValue = boolean | number | string;
export type GameSettingToggleKey = {
  [K in GameSettingKey]: GameSettings[K] extends boolean ? K : never;
}[GameSettingKey];

export type GameSettingToggleDefinition = {
  key: GameSettingToggleKey;
  title: string;
  description: string;
  ariaLabel: string;
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  unlimitedVotingTime: false,
  unlimitedPlacingTime: false,
};

const GAME_SETTING_KEYS = Object.keys(
  DEFAULT_GAME_SETTINGS,
) as GameSettingKey[];

export const GAME_SETTING_TOGGLE_DEFINITIONS: readonly GameSettingToggleDefinition[] =
  [
    {
      key: "unlimitedPlacingTime",
      title: "Unlimited Placing Time",
      description:
        "The current placer can take as long as they need before placing or passing.",
      ariaLabel: "Toggle unlimited placing time",
    },
    {
      key: "unlimitedVotingTime",
      title: "Unlimited Voting Time",
      description:
        "Players have unlimited time to vote and the game waits until every eligible voter locks in.",
      ariaLabel: "Toggle unlimited voting time",
    },
  ];

function matchesStoredGameSettingValue(
  value: unknown,
  defaultValue: StoredGameSettingValue,
): boolean {
  if (typeof defaultValue === "boolean") return typeof value === "boolean";
  if (typeof defaultValue === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (typeof defaultValue === "string") return typeof value === "string";
  return false;
}

export function normalizeGameSettings(input: unknown): GameSettings {
  const normalized: GameSettings = { ...DEFAULT_GAME_SETTINGS };
  if (!isObject(input)) return normalized;

  const obj = input as Record<string, unknown>;
  for (const key of GAME_SETTING_KEYS) {
    const defaultValue = DEFAULT_GAME_SETTINGS[key] as StoredGameSettingValue;
    const nextValue = obj[key];

    if (!matchesStoredGameSettingValue(nextValue, defaultValue)) continue;
    normalized[key] = nextValue as GameSettings[typeof key];
  }

  return normalized;
}

export function updateGameSetting<K extends GameSettingKey>(
  settings: GameSettings,
  key: K,
  value: GameSettings[K],
): GameSettings {
  return {
    ...settings,
    [key]: value,
  };
}

export function areGameSettingsEqual(
  left: GameSettings,
  right: GameSettings,
): boolean {
  return GAME_SETTING_KEYS.every((key) => left[key] === right[key]);
}

export function areGameSettingsDefault(settings: GameSettings): boolean {
  return areGameSettingsEqual(settings, DEFAULT_GAME_SETTINGS);
}

export function readSavedHostLobbyGameSettings(): GameSettings {
  const raw = readStorageValue(
    getWebStorage("local"),
    LOCAL_STORAGE_KEYS.HOST_LOBBY_GAME_SETTINGS,
  );
  if (raw == null) return { ...DEFAULT_GAME_SETTINGS };

  try {
    return normalizeGameSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export function saveHostLobbyGameSettings(settings: GameSettings) {
  writeStorageValue(
    getWebStorage("local"),
    LOCAL_STORAGE_KEYS.HOST_LOBBY_GAME_SETTINGS,
    JSON.stringify(settings),
  );
}
