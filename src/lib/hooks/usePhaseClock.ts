import { useEffect, useMemo, useState } from "react";
import * as Contracts from "@twf/contracts";
type RoomPublicState = Contracts.RoomPublicState;

export type PhaseClock = {
  endsAt: number | null;
  msLeft: number | null;
  secondsLeft: number | null;
  progress01: number | null; // 0..1, best-effort
};

// Server timestamps are absolute epoch ms.
// Only compute “how much time is left” for UI/animation.
export function usePhaseClock(state: RoomPublicState | null): PhaseClock {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);

  const endsAt = useMemo(() => {
    if (!state) return null;
    const t = state.timers ?? {};
    switch (state.phase) {
      case "STARTING":
        return t.buildEndsAt ?? null;
      case "PLACE":
        return t.placeEndsAt ?? null;
      case "VOTE":
        return t.voteEndsAt ?? null;
      case "RESULTS":
        return t.resultsEndsAt ?? null;
      case "DRIFT":
        return t.driftEndsAt ?? null;
      default:
        return null;
    }
  }, [state]);

  const msLeft = endsAt == null ? null : Math.max(0, endsAt - now);
  const secondsLeft = msLeft == null ? null : Math.ceil(msLeft / 1000);

  // If later include durations in contracts (e.g., buildMs/revealMs…),
  // replace this with deterministic progress = 1 - msLeft/duration.
  const progress01 = endsAt == null ? null : null;

  return { endsAt, msLeft, secondsLeft, progress01 };
}
