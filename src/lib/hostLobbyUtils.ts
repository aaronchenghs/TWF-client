import type { Guid } from "@/lib/guid";

export function getStartDisabledReason(args: {
  selectedTierSetId: Guid | null;
  playerCount: number;
}) {
  const { selectedTierSetId, playerCount } = args;
  const hasTierSet = !!selectedTierSetId;
  const hasEnoughPlayers = playerCount >= 2;

  if (!hasTierSet && !hasEnoughPlayers)
    return "Select a tier set and have at least 2 players to start.";
  if (!hasTierSet) return "Select a tier set to start.";
  if (!hasEnoughPlayers) return "At least 2 players are needed to start.";
  return null;
}
