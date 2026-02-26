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
const IRIS_ENTER_DURATION_MULTIPLIER = 2.4;

const FADE_SLIDE_OFFSET = 40;
const FADE_SLIDE_DURATION_MS = 400;

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

export function buildFadeSlideAnimation(
  reduceMotion: boolean,
): RouteAnimationPreset {
  if (reduceMotion) {
    return {
      initial: { opacity: 0, x: 0 },
      animate: { opacity: 1, x: 0, transition: { duration: 0.01 } },
      exit: { opacity: 0, x: 0, transition: { duration: 0.01 } },
    } as RouteAnimationPreset;
  }

  return {
    initial: { opacity: 0, x: FADE_SLIDE_OFFSET },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: FADE_SLIDE_DURATION_MS / 1000,
        ease: easeOut,
      },
    },
    exit: {
      opacity: 0,
      x: -FADE_SLIDE_OFFSET,
      transition: {
        duration: FADE_SLIDE_DURATION_MS / 1000,
        ease: easeIn,
      },
    },
  } as RouteAnimationPreset;
}
