import type { Guid } from "@/lib/guid";
import type { RoomPublicState } from "@twf/contracts";
import { hasSubmittedPlayerName } from "@/lib/players";

export function getStartDisabledReason(args: {
  selectedTierSetId: Guid | null;
  playerCount: number;
  players?: RoomPublicState["players"];
}) {
  const { selectedTierSetId, playerCount, players = [] } = args;
  const hasTierSet = !!selectedTierSetId;
  const hasEnoughPlayers = playerCount >= 2;
  const hasPendingNames = players.some(
    (player) => !hasSubmittedPlayerName(player.name),
  );

  if (!hasTierSet && !hasEnoughPlayers)
    return "Select a tier set and have at least 2 players to start.";
  if (!hasTierSet && hasPendingNames)
    return "Select a tier set and wait for every player to submit a name.";
  if (!hasTierSet) return "Select a tier set to start.";
  if (!hasEnoughPlayers) return "At least 2 players are needed to start.";
  if (hasPendingNames)
    return "All players must submit a name before the game can start.";
  return null;
}
