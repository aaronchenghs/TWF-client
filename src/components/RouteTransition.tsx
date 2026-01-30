import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Direction = "left" | "right";

export function RouteTransition({
  children,
  routeKey,
  direction = "left",
  durationMs = 200,
}: PropsWithChildren<{
  routeKey: string;
  direction?: Direction;
  durationMs?: number;
}>) {
  const offset = 18;
  const enterX = direction === "left" ? -offset : offset;
  const exitX = direction === "left" ? offset : -offset;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        style={{
          position: "absolute",
          inset: 0,
        }}
        initial={{ opacity: 0, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: exitX }}
        transition={{
          duration: durationMs / 1000,
          ease: [0.2, 0.8, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
