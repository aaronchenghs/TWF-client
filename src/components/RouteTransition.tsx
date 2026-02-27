import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TransitionKind } from "../lib/routeTransitionRules";
import { useAppSelector, type AppState } from "@/store/store";
import {
  buildIrisAnimation,
  buildCrossfadeAnimation,
  TRANSITION_PRESENCE_MODE_BY_KIND,
} from "@/lib/routeTransitionPresets";

export function RouteTransition({
  children,
  routeKey,
  kind = "crossfade",
  durationMs = 650,
}: PropsWithChildren<{
  routeKey: string;
  kind?: TransitionKind;
  durationMs?: number;
}>) {
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );

  const animationByKind = {
    iris: buildIrisAnimation($isReduceMotion, durationMs),
    crossfade: buildCrossfadeAnimation($isReduceMotion),
  } as const;

  const routeAnimation = animationByKind[kind] ?? animationByKind.crossfade;
  const presenceMode = TRANSITION_PRESENCE_MODE_BY_KIND[kind] ?? "sync";

  return (
    <AnimatePresence mode={presenceMode} initial={false}>
      <motion.div
        {...routeAnimation}
        key={routeKey}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
