import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TransitionKind } from "../lib/routeTransitionRules";
import { useAppSelector, type AppState } from "@/store/store";
import {
  buildFadeSlideAnimation,
  buildIrisAnimation,
} from "@/lib/routeTransitionPresets";

export function RouteTransition({
  children,
  routeKey,
  kind = "fade",
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
    fade: buildFadeSlideAnimation($isReduceMotion),
  } as const;

  const routeAnimation = animationByKind[kind] ?? animationByKind.fade;
  const presenceMode = kind === "iris" ? "wait" : "sync";

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
