import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type * as Contracts from "@twf/contracts";
import { useAppSelector, type AppState } from "@/store/store";

type RoomPhase = Contracts.RoomPublicState["phase"];

let confettiBurst: confetti.CreateTypes | null = null;

function getConfettiBurst() {
  confettiBurst ??= confetti.create(undefined, {
    resize: true,
    useWorker: true,
    disableForReducedMotion: true,
  });

  return confettiBurst;
}

export function useFinishedPhaseConfetti(phase: RoomPhase | null) {
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const prevPhaseRef = useRef<RoomPhase | null>(null);

  useEffect(
    function triggerConfettiOnFinishedPhaseEnter() {
      const previousPhase = prevPhaseRef.current;
      prevPhaseRef.current = phase;

      const hasEnteredFinished =
        previousPhase !== null &&
        previousPhase !== "FINISHED" &&
        phase === "FINISHED";

      if (!hasEnteredFinished || $isReduceMotion) return;

      window.requestAnimationFrame(() => {
        const burst = getConfettiBurst();

        burst({
          particleCount: 110,
          spread: 70,
          startVelocity: 44,
          ticks: 220,
          scalar: 0.9,
          origin: { x: 0.5, y: 0.62 },
        });
        burst({
          particleCount: 42,
          angle: 60,
          spread: 52,
          startVelocity: 36,
          ticks: 185,
          scalar: 0.8,
          origin: { x: 0, y: 0.74 },
        });
        burst({
          particleCount: 42,
          angle: 120,
          spread: 52,
          startVelocity: 36,
          ticks: 185,
          scalar: 0.8,
          origin: { x: 1, y: 0.74 },
        });
      });
    },
    [phase, $isReduceMotion],
  );
}
