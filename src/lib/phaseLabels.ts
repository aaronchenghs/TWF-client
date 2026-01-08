import type { RoomPublicState } from "@twf/contracts";

export function getTurnLabel(state: RoomPublicState): string {
  const pid = state.currentTurnPlayerId;
  if (!pid) return "—";
  const p = state.players.find((x) => x.id === pid);
  return p ? `${p.name}'s turn` : "—";
}

export function phaseLabel(phase: RoomPublicState["phase"]): string {
  switch (phase) {
    case "STARTING":
      return "Starting";
    case "REVEAL":
      return "Reveal";
    case "PLACE":
      return "Place";
    case "VOTE":
      return "Vote";
    case "RESULTS":
      return "Results";
    case "DRIFT":
      return "Drift";
    case "RESOLVE":
      return "Resolve";
    case "FINISHED":
      return "Finished";
    case "LOBBY":
      return "Lobby";
    default:
      return phase;
  }
}

export function phaseSubtext(
  state: RoomPublicState,
  currentTurnPlayer: { name: string } | null,
  isMyTurn: boolean
): string {
  if (state.phase === "PLACE")
    return isMyTurn
      ? "Pick a tier."
      : `Waiting on ${currentTurnPlayer?.name ?? "player"} to place.`;
  if (state.phase === "VOTE")
    return isMyTurn
      ? "You placed. Waiting for votes."
      : "Vote to drift up, agree, or drift down.";
  if (state.phase === "REVEAL") return "Next item revealed.";
  if (state.phase === "RESULTS") return "Votes tallied.";
  if (state.phase === "DRIFT") return "Applying drift.";
  if (state.phase === "RESOLVE") return "Locking item in.";
  if (state.phase === "FINISHED") return "Game over.";
  if (state.phase === "STARTING") return "Building turn order.";
  return "Waiting…";
}
