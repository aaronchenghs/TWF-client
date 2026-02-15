import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TransitionDirection } from "../lib/routeTransitionRules";
import { buildSlideAnimation } from "@/lib/motionPresets";
import { useAppSelector, type AppState } from "@/store/store";

const INITIAL_OFFSET = 2000;

export function RouteTransition({
  children,
  routeKey,
  direction = "left",
  durationMs = 450,
}: PropsWithChildren<{
  routeKey: string;
  direction?: TransitionDirection;
  durationMs?: number;
}>) {
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const enterX = $isReduceMotion
    ? 0
    : direction === "left"
      ? -INITIAL_OFFSET
      : INITIAL_OFFSET;
  const exitX = $isReduceMotion
    ? 0
    : direction === "left"
      ? INITIAL_OFFSET
      : -INITIAL_OFFSET;

  const slideAnimation = buildSlideAnimation({
    axis: "x",
    enterFrom: enterX,
    exitTo: exitX,
    durationMs,
    reduceMotion: $isReduceMotion,
    opacity: { from: 0.25, to: 1, exit: 0.25 },
  });

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        {...slideAnimation}
        key={routeKey}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
