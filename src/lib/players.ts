type PlayerLike = {
  id: string;
  name: string;
};

export function getPlayerNameById(
  players: readonly PlayerLike[],
  playerId: string | null | undefined,
  fallback = "PLAYER",
): string {
  if (!playerId) return fallback;
  return players.find((player) => player.id === playerId)?.name ?? fallback;
}
