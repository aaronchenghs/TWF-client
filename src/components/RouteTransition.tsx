import type { PropsWithChildren } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TransitionDirection } from "../lib/routeTransitionRules";
import { buildSlideAnimation } from "@/lib/motionPresets";

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
  const enterX = direction === "left" ? -INITIAL_OFFSET : INITIAL_OFFSET;
  const exitX = direction === "left" ? INITIAL_OFFSET : -INITIAL_OFFSET;
  const prefersReducedMotion = useReducedMotion();

  const slideAnimation = buildSlideAnimation({
    axis: "x",
    enterFrom: enterX,
    exitTo: exitX,
    durationMs,
    reduceMotion: prefersReducedMotion,
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
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
