import type { TargetAndTransition, Transition } from "framer-motion";
import { easeIn, easeInOut, easeOut } from "framer-motion";

export type RouteAnimationPreset = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition?: Transition;
};

const IRIS_OPEN_CLIP_PATH = "circle(150vmax at 50% 50%)";
const IRIS_CLOSED_CLIP_PATH = "circle(0px at 50% 50%)";

const IRIS_EXIT_DURATION_MS = 980;
const IRIS_ENTER_DURATION_MULTIPLIER = 2;

const CROSSFADE_DURATION_MS = 300;
const CROSSFADE_EXIT_SCALE = 0.9;
const CROSSFADE_ENTER_SCALE = 1.1;

export const TRANSITION_PRESENCE_MODE_BY_KIND = {
  iris: "wait",
  crossfade: "wait",
} as const;

export function buildIrisAnimation(
  reduceMotion: boolean,
  durationMs: number,
): RouteAnimationPreset {
  if (reduceMotion) {
    return {
      initial: {
        clipPath: IRIS_CLOSED_CLIP_PATH,
        WebkitClipPath: IRIS_CLOSED_CLIP_PATH,
        opacity: 1,
      },
      animate: {
        clipPath: IRIS_OPEN_CLIP_PATH,
        WebkitClipPath: IRIS_OPEN_CLIP_PATH,
        opacity: 1,
      },
      exit: {
        clipPath: IRIS_CLOSED_CLIP_PATH,
        WebkitClipPath: IRIS_CLOSED_CLIP_PATH,
        opacity: 1,
      },
      transition: { duration: 0.01 },
    } as RouteAnimationPreset;
  }

  return {
    initial: {
      clipPath: IRIS_CLOSED_CLIP_PATH,
      WebkitClipPath: IRIS_CLOSED_CLIP_PATH,
      opacity: 1,
    },
    animate: {
      clipPath: IRIS_OPEN_CLIP_PATH,
      WebkitClipPath: IRIS_OPEN_CLIP_PATH,
      opacity: 1,
    },
    exit: {
      clipPath: IRIS_CLOSED_CLIP_PATH,
      WebkitClipPath: IRIS_CLOSED_CLIP_PATH,
      opacity: 1,
      transition: {
        duration: IRIS_EXIT_DURATION_MS / 1000,
        ease: easeOut,
      },
    },
    transition: {
      duration: (durationMs * IRIS_ENTER_DURATION_MULTIPLIER) / 1000,
      ease: easeInOut,
    },
  } as RouteAnimationPreset;
}

export function buildCrossfadeAnimation(
  reduceMotion: boolean,
): RouteAnimationPreset {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    } as RouteAnimationPreset;
  }

  return {
    initial: { opacity: 0, scale: CROSSFADE_ENTER_SCALE },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: CROSSFADE_DURATION_MS / 1000,
        ease: easeOut,
      },
    },
    exit: {
      opacity: 0,
      scale: CROSSFADE_EXIT_SCALE,
      transition: {
        duration: CROSSFADE_DURATION_MS / 1000,
        ease: easeIn,
      },
    },
  } as RouteAnimationPreset;
}
