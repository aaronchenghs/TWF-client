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
