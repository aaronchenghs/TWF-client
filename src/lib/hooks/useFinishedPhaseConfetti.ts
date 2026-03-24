import { useEffect, useRef } from "react";
import type { CreateTypes } from "canvas-confetti";
import type confetti from "canvas-confetti";
import type { RoomPublicState } from "@twf/contracts";
import { ROUTES, type RoutePath } from "@/routes/routes";
import { useAppSelector, type AppState } from "@/store/store";

type RoomPhase = RoomPublicState["phase"];
type ConfettiModule = typeof confetti;
type FinishedPhaseConfettiHandler = (burst: CreateTypes) => void;
let confettiBurst: CreateTypes | null = null;
let confettiModulePromise: Promise<ConfettiModule> | null = null;

export function useFinishedPhaseConfetti(
  phase: RoomPhase | null,
  route: RoutePath = ROUTES.PLAYER_SESSION,
) {
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
        void fireFinishedPhaseConfetti(route);
      });
    },
    [phase, route, $isReduceMotion],
  );
}

// #region Utilities

async function fireFinishedPhaseConfetti(route: RoutePath) {
  const burst = await getConfettiBurst();
  const fireConfetti =
    FINISHED_PHASE_CONFETTI_BY_ROUTE.get(route) ?? firePlayerControllerConfetti;

  fireConfetti(burst);
}

async function getConfettiBurst(): Promise<CreateTypes> {
  if (confettiBurst) return confettiBurst;

  const confettiModule = await getConfettiModule();

  /** Keep motion gating in the hook so behavior follows the app setting
   consistently instead of also depending on OS-level reduced-motion. */
  const burst = confettiModule.create(undefined, {
    resize: true,
    useWorker: true,
  });
  confettiBurst = burst;

  return burst;
}

function getConfettiModule() {
  if (!confettiModulePromise) {
    confettiModulePromise = import("canvas-confetti").then((module) => {
      return (
        (module as { default?: ConfettiModule }).default ??
        (module as unknown as ConfettiModule)
      );
    });
  }

  return confettiModulePromise;
}

function firePlayerControllerConfetti(burst: confetti.CreateTypes) {
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
}

function fireGameRoomConfetti(burst: confetti.CreateTypes) {
  burst({
    particleCount: 180,
    spread: 92,
    startVelocity: 50,
    ticks: 260,
    scalar: 1.1,
    origin: { x: 0.5, y: 0.64 },
  });
  burst({
    particleCount: 80,
    angle: 58,
    spread: 68,
    startVelocity: 42,
    ticks: 225,
    scalar: 1,
    origin: { x: 0, y: 0.72 },
  });
  burst({
    particleCount: 80,
    angle: 122,
    spread: 68,
    startVelocity: 42,
    ticks: 225,
    scalar: 1,
    origin: { x: 1, y: 0.72 },
  });
  burst({
    particleCount: 50,
    angle: 72,
    spread: 58,
    startVelocity: 46,
    ticks: 235,
    scalar: 0.95,
    origin: { x: 0.12, y: 0.46 },
  });
  burst({
    particleCount: 50,
    angle: 108,
    spread: 58,
    startVelocity: 46,
    ticks: 235,
    scalar: 0.95,
    origin: { x: 0.88, y: 0.46 },
  });
}

const FINISHED_PHASE_CONFETTI_BY_ROUTE = new Map<
  RoutePath,
  FinishedPhaseConfettiHandler
>([
  [ROUTES.PLAYER_SESSION, firePlayerControllerConfetti],
  [ROUTES.GAME_ROOM, fireGameRoomConfetti],
]);

// #endregion Utilities
