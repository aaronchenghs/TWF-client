import type { PropsWithChildren } from "react";
import { AnimatePresence, easeInOut, motion } from "framer-motion";
import type { TransitionDirection } from "../lib/routeTransitionRules";

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
  const offset = 2000;
  const enterX = direction === "left" ? -offset : offset;
  const exitX = direction === "left" ? offset : -offset;

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={routeKey}
        style={{
          position: "absolute",
          inset: 0,
        }}
        initial={{ opacity: 0.25, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0.25, x: exitX }}
        transition={{
          duration: durationMs / 1000,
          ease: easeInOut,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
