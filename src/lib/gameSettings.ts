import { isObject } from "radashi";
import type { RoomPublicState } from "@twf/contracts";
import { LOCAL_STORAGE_KEYS } from "@/lib/localStorage";
import { safeJsonParse } from "@/lib/json";
import {
  getWebStorage,
  readStorageValue,
  writeStorageValue,
} from "@/lib/webStorage";

/**
 * Adding a new custom game setting:
 * 1. Add the key to `DEFAULT_GAME_SETTINGS` so it becomes part of the canonical
 *    shape used by normalization, equality checks, and storage.
 * 2. Update `normalizeGameSettings` (and any helper normalizers) so persisted,
 *    incoming, and legacy values are coerced into that canonical shape.
 * 3. If the setting should render in the Host Lobby customization modal using
 *    grouped preset buttons, add a definition here alongside the existing
 *    timing definitions.
 * 4. If the setting needs a different control type, keep the data/storage
 *    helpers in this file and add a dedicated UI component for that control.
 * 5. Mirror any new setting keys in the shared contracts/server flow so the UI
 *    and runtime behavior stay in sync.
 *
 * Note: the canonical time settings are explicit duration values. The legacy
 * `unlimited*` booleans are still derived and normalized for compatibility.
 */
export type GameSettings = RoomPublicState["gameSettings"];
type GameSettingKey = keyof GameSettings;
export type GameSettingTimingKey =
  | "placingTimeLimitSeconds"
  | "votingTimeLimitSeconds";

export const PLACING_TIME_LIMIT_OPTIONS = [20, 30, 45, null] as const;
export type PlacingTimeLimitSeconds =
  (typeof PLACING_TIME_LIMIT_OPTIONS)[number];

export const VOTING_TIME_LIMIT_OPTIONS = [45, 60, 120, null] as const;
export type VotingTimeLimitSeconds = (typeof VOTING_TIME_LIMIT_OPTIONS)[number];

export const DEFAULT_PLACING_TIME_LIMIT_SECONDS: Exclude<
  PlacingTimeLimitSeconds,
  null
> = 30;
export const DEFAULT_VOTING_TIME_LIMIT_SECONDS: Exclude<
  VotingTimeLimitSeconds,
  null
> = 60;

export type GameSettingTimingOption = {
  label: string;
  value: GameSettings[GameSettingTimingKey];
  detail: string;
  ariaLabel: string;
  labelStyle?: "default" | "symbol";
};

export type GameSettingTimingDefinition = {
  key: GameSettingTimingKey;
  title: string;
  description: string;
  ariaLabel: string;
  options: readonly GameSettingTimingOption[];
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  placingTimeLimitSeconds: DEFAULT_PLACING_TIME_LIMIT_SECONDS,
  votingTimeLimitSeconds: DEFAULT_VOTING_TIME_LIMIT_SECONDS,
  unlimitedVotingTime: false,
  unlimitedPlacingTime: false,
};

const GAME_SETTING_KEYS = Object.keys(
  DEFAULT_GAME_SETTINGS,
) as GameSettingKey[];

export const GAME_SETTING_TIMING_DEFINITIONS: readonly GameSettingTimingDefinition[] =
  [
    {
      key: "placingTimeLimitSeconds",
      title: "Placing Time",
      description: "Choose how long the active placer has to place or pass.",
      ariaLabel: "Choose placing time",
      options: [
        {
          label: "Short",
          value: 20,
          detail: "20s",
          ariaLabel: "Set placing time to 20 seconds",
        },
        {
          label: "Normal",
          value: 30,
          detail: "30s",
          ariaLabel: "Set placing time to 30 seconds",
        },
        {
          label: "Long",
          value: 45,
          detail: "45s",
          ariaLabel: "Set placing time to 45 seconds",
        },
        {
          label: "\u221E",
          value: null,
          detail: "No limit",
          ariaLabel: "Set placing time to unlimited",
          labelStyle: "symbol",
        },
      ],
    },
    {
      key: "votingTimeLimitSeconds",
      title: "Voting Time",
      description: "Choose how long voters have to lock in.",
      ariaLabel: "Choose voting time",
      options: [
        {
          label: "Short",
          value: 45,
          detail: "45s",
          ariaLabel: "Set voting time to 45 seconds",
        },
        {
          label: "Normal",
          value: 60,
          detail: "60s",
          ariaLabel: "Set voting time to 60 seconds",
        },
        {
          label: "Long",
          value: 120,
          detail: "120s",
          ariaLabel: "Set voting time to 120 seconds",
        },
        {
          label: "\u221E",
          value: null,
          detail: "No limit",
          ariaLabel: "Set voting time to unlimited",
          labelStyle: "symbol",
        },
      ],
    },
  ];

function isPlacingTimeLimitSeconds(
  value: unknown,
): value is PlacingTimeLimitSeconds {
  return PLACING_TIME_LIMIT_OPTIONS.some((option) => option === value);
}

function isVotingTimeLimitSeconds(
  value: unknown,
): value is VotingTimeLimitSeconds {
  return VOTING_TIME_LIMIT_OPTIONS.some((option) => option === value);
}

function normalizePlacingTimeLimitSeconds(
  candidate: Record<string, unknown>,
): PlacingTimeLimitSeconds {
  if (isPlacingTimeLimitSeconds(candidate.placingTimeLimitSeconds))
    return candidate.placingTimeLimitSeconds;

  return candidate.unlimitedPlacingTime === true
    ? null
    : DEFAULT_PLACING_TIME_LIMIT_SECONDS;
}

function normalizeVotingTimeLimitSeconds(
  candidate: Record<string, unknown>,
): VotingTimeLimitSeconds {
  if (isVotingTimeLimitSeconds(candidate.votingTimeLimitSeconds))
    return candidate.votingTimeLimitSeconds;

  return candidate.unlimitedVotingTime === true
    ? null
    : DEFAULT_VOTING_TIME_LIMIT_SECONDS;
}

export function normalizeGameSettings(input: unknown): GameSettings {
  if (!isObject(input)) return { ...DEFAULT_GAME_SETTINGS };

  const candidate = input as Record<string, unknown>;
  const placingTimeLimitSeconds = normalizePlacingTimeLimitSeconds(candidate);
  const votingTimeLimitSeconds = normalizeVotingTimeLimitSeconds(candidate);

  return {
    placingTimeLimitSeconds,
    votingTimeLimitSeconds,
    unlimitedPlacingTime: placingTimeLimitSeconds === null,
    unlimitedVotingTime: votingTimeLimitSeconds === null,
  };
}

export function updateGameSetting<K extends GameSettingKey>(
  settings: GameSettings,
  key: K,
  value: GameSettings[K],
): GameSettings {
  return normalizeGameSettings({
    ...settings,
    [key]: value,
  });
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

  const parsed = safeJsonParse(raw);
  return parsed ? normalizeGameSettings(parsed) : { ...DEFAULT_GAME_SETTINGS };
}

export function saveHostLobbyGameSettings(settings: GameSettings) {
  writeStorageValue(
    getWebStorage("local"),
    LOCAL_STORAGE_KEYS.HOST_LOBBY_GAME_SETTINGS,
    JSON.stringify(settings),
  );
}
