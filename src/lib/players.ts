import type * as Contracts from "@twf/contracts";
import { orderByIdsKeepingExtras } from "@/lib/array";

type PlayerLike = {
  id: string;
  name: string;
};
type RoomPublicState = Contracts.RoomPublicState;
type RoomPlayer = RoomPublicState["players"][number];

export function getPlayerNameById(
  players: readonly PlayerLike[],
  playerId: string | null | undefined,
  fallback = "PLAYER",
): string {
  if (!playerId) return fallback;
  return players.find((player) => player.id === playerId)?.name ?? fallback;
}

export function getPlayersInTurnDisplayOrder(
  state: RoomPublicState,
): RoomPlayer[] {
  if (state.players.length <= 1) return state.players;
  if (state.turnOrderPlayerIds.length === 0) return state.players;

  // Keep rows stable in the UI: top-to-bottom is always fixed turn order.
  return orderByIdsKeepingExtras(state.players, state.turnOrderPlayerIds);
}

function getConnectedPlayerIdSet(state: RoomPublicState): Set<string> {
  const ids = new Set<string>();
  for (const player of state.players)
    if (player.connected !== false) ids.add(player.id);
  return ids;
}

/**
 * Returns the number of players who joined and left between two states. Note that
 * this is not necessarily the same as the change in player count, since players may
 * join and leave in the same update, or the player count may change for other reasons.
 */
export function getPlayerDelta(prev: RoomPublicState, next: RoomPublicState) {
  const prevIds = getConnectedPlayerIdSet(prev);
  const nextIds = getConnectedPlayerIdSet(next);

  let joinedCount = 0;
  let leftCount = 0;
  for (const id of nextIds) if (!prevIds.has(id)) joinedCount += 1;
  for (const id of prevIds) if (!nextIds.has(id)) leftCount += 1;

  return { joinedCount, leftCount };
}
