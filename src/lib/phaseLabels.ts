import * as Contracts from "@twf/contracts";
type RoomPublicState = Contracts.RoomPublicState;

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
  const turnName = currentTurnPlayer?.name ?? "player";
  const byPhase: Partial<
    Record<
      RoomPublicState["phase"],
      string | ((ctx: { isMyTurn: boolean; turnName: string }) => string)
    >
  > = {
    PLACE: ({ isMyTurn, turnName }) =>
      isMyTurn ? "Pick a tier." : `Waiting on ${turnName} to place.`,
    VOTE: ({ isMyTurn }) =>
      isMyTurn
        ? "You placed. Waiting for votes."
        : "Vote to drift up, agree, or drift down.",
    REVEAL: "Next item revealed",
    RESULTS: "Votes tallied",
    DRIFT: "Applying votes",
    RESOLVE: "Locking item in",
    FINISHED: "Game over",
    STARTING: "Building turn order",
    LOBBY: "Waiting…",
  };

  const entry = byPhase[state.phase];
  if (!entry) return "Waiting…";
  return typeof entry === "function" ? entry({ isMyTurn, turnName }) : entry;
}
