import { useEffect, useMemo, useState } from "react";
import type { RoomPublicState } from "@twf/contracts";

type PhaseClock = {
  endsAt: number | null;
  msLeft: number | null;
  secondsLeft: number | null;
  progress01: number | null; // 0..1
};

// Server timestamps are absolute epoch ms.
// Only compute "how much time is left" for UI/animation.
export function usePhaseClock(
  state: RoomPublicState | null,
  tickMs = 1000,
): PhaseClock {
  const [now, setNow] = useState(() => Date.now());
  const [phaseInitialDurationMs, setPhaseInitialDurationMs] = useState<
    number | null
  >(null);
  const phase = state?.phase ?? null;

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
      default:
        return null;
    }
  }, [state]);

  useEffect(
    function capturePhaseInitialDuration() {
      let rafId = 0;

      if (!phase || endsAt == null) {
        rafId = window.requestAnimationFrame(() => {
          setPhaseInitialDurationMs(null);
        });
        return () => window.cancelAnimationFrame(rafId);
      }

      const initialDurationMs = Math.max(0, endsAt - Date.now());
      rafId = window.requestAnimationFrame(() => {
        setPhaseInitialDurationMs(initialDurationMs);
      });

      return () => window.cancelAnimationFrame(rafId);
    },
    [phase, endsAt],
  );

  useEffect(
    function syncPhaseClock() {
      if (endsAt == null) return;

      // Use RAF for high-frequency updates so sweep visuals remain smooth.
      if (tickMs <= 200) {
        let rafId = 0;
        const update = () => {
          setNow(Date.now());
          rafId = window.requestAnimationFrame(update);
        };

        rafId = window.requestAnimationFrame(update);
        return () => window.cancelAnimationFrame(rafId);
      }

      const id = window.setInterval(() => setNow(Date.now()), tickMs);
      return () => window.clearInterval(id);
    },
    [endsAt, tickMs],
  );

  const msLeft = endsAt == null ? null : Math.max(0, endsAt - now);
  const secondsLeft = msLeft == null ? null : Math.ceil(msLeft / 1000);
  const phaseDurationForProgress =
    phaseInitialDurationMs == null ? msLeft : phaseInitialDurationMs;
  const progress01 =
    msLeft == null ||
    phaseDurationForProgress == null ||
    phaseDurationForProgress <= 0
      ? null
      : Math.min(1, Math.max(0, msLeft / phaseDurationForProgress));

  return { endsAt, msLeft, secondsLeft, progress01 };
}
