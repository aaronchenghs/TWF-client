import type * as Contracts from "@twf/contracts";

export type GameSettings = Contracts.RoomPublicState["gameSettings"];

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  unlimitedVotingTime: false,
  unlimitedPlacingTime: false,
};

export function areGameSettingsDefault(settings: GameSettings): boolean {
  return (
    settings.unlimitedVotingTime ===
      DEFAULT_GAME_SETTINGS.unlimitedVotingTime &&
    settings.unlimitedPlacingTime === DEFAULT_GAME_SETTINGS.unlimitedPlacingTime
  );
}
