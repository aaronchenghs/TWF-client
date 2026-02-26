import type { TargetAndTransition, Transition } from "framer-motion";
import { easeInOut, easeIn, easeOut } from "framer-motion";

type Ease = Transition["ease"];

export const MOTION_EASE = {
  enter: easeOut,
  exit: easeIn,
  route: easeInOut,
};

const REDUCED_MOTION_TRANSITION = { duration: 0.01 };

type SlideHoldOptions = {
  axis: "x" | "y";
  enterFrom: number | string;
  exitTo?: number | string;
  totalMs: number;
  enterMs: number;
  enterScale?: number;
  exitScale?: number;
  fade?: boolean;
  reduceMotion?: boolean | null;
  ease?: Ease;
  exitEase?: Ease;
  exitMs?: number;
};

type SimpleSlideOptions = {
  axis: "x" | "y";
  enterFrom: number | string;
  exitTo: number | string;
  durationMs: number;
  reduceMotion?: boolean | null;
  ease?: Ease;
  opacity?: {
    from?: number;
    to?: number;
    exit?: number;
  };
};

type MotionTriplet = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit?: TargetAndTransition;
  transition?: Transition;
};

type FadeSlideScaleOptions = {
  axis?: "x" | "y";
  enterOffset?: number;
  exitOffset?: number;
  enterScale?: number;
  exitScale?: number;
  reduceMotion?: boolean | null;
  durationMs?: number;
  delay?: number;
  ease?: Ease;
  includeExit?: boolean;
};

function getAxisRestValue(value: number | string): number | string {
  if (typeof value === "number") return 0;

  const unitMatch = value.trim().match(/[a-z%]+$/i);
  if (!unitMatch) return "0";
  return `0${unitMatch[0]}`;
}

/**
 * Slides in over `enterMs`, then holds position for the remainder of `totalMs`,
 * optionally fading/scaling on enter and a short slide/fade on exit.
 */
export function buildHoldSlideAnimation({
  axis,
  enterFrom,
  exitTo,
  totalMs,
  enterMs,
  enterScale,
  exitScale,
  fade = true,
  reduceMotion = false,
  ease = MOTION_EASE.enter,
  exitEase = MOTION_EASE.exit,
  exitMs = 160,
}: SlideHoldOptions): MotionTriplet {
  const restValue = getAxisRestValue(enterFrom);
  const resolvedExitTo = exitTo === undefined ? restValue : exitTo;
  const holdMs = Math.max(0, totalMs - enterMs);
  const totalAnimateS = (enterMs + holdMs) / 1000;
  const enterFrac = totalAnimateS > 0 ? enterMs / 1000 / totalAnimateS : 1;

  const initial: TargetAndTransition = {
    [axis]: enterFrom,
  };
  if (fade) initial.opacity = 0;
  if (enterScale !== undefined) initial.scale = enterScale;

  const animate: TargetAndTransition = {
    [axis]: [enterFrom, restValue, restValue],
  };
  if (fade) animate.opacity = [0, 1, 1];
  if (enterScale !== undefined) animate.scale = [enterScale, 1, 1];
  animate.transition = reduceMotion
    ? REDUCED_MOTION_TRANSITION
    : {
        duration: totalAnimateS,
        times: [0, enterFrac, 1],
        ease,
      };

  const exit: TargetAndTransition = {
    [axis]: resolvedExitTo,
  };
  if (fade) exit.opacity = 0;
  if (exitScale !== undefined) exit.scale = exitScale;
  exit.transition = reduceMotion
    ? REDUCED_MOTION_TRANSITION
    : { duration: exitMs / 1000, ease: exitEase };

  return { initial, animate, exit };
}

/**
 * Fades and slides in over `durationMs`, with optional scale and optional exit
 * fade/slide, while honoring reduced motion and optional start delay.
 */
export function buildFadeSlideScaleAnimation({
  axis = "y",
  enterOffset = 12,
  exitOffset = -6,
  enterScale,
  exitScale,
  reduceMotion = false,
  durationMs = 180,
  delay,
  ease = MOTION_EASE.enter,
  includeExit = false,
}: FadeSlideScaleOptions): MotionTriplet {
  const initial: TargetAndTransition = {
    opacity: 0,
    [axis]: enterOffset,
  };
  if (enterScale !== undefined) initial.scale = enterScale;

  const animate: TargetAndTransition = {
    opacity: 1,
    [axis]: 0,
  };
  if (enterScale !== undefined) animate.scale = 1;

  const transition = reduceMotion
    ? REDUCED_MOTION_TRANSITION
    : {
        duration: durationMs / 1000,
        ease,
        ...(delay === undefined ? {} : { delay }),
      };

  const motion: MotionTriplet = { initial, animate, transition };

  if (includeExit) {
    const exit: TargetAndTransition = {
      opacity: 0,
      [axis]: exitOffset,
    };
    if (exitScale !== undefined) exit.scale = exitScale;
    motion.exit = exit;
  }

  return motion;
}

/** Simple enter/exit slide with optional opacity values and a single duration. */
export function buildSlideAnimation({
  axis,
  enterFrom,
  exitTo,
  durationMs,
  reduceMotion = false,
  ease = MOTION_EASE.route,
  opacity,
}: SimpleSlideOptions): MotionTriplet {
  const opacityFrom = opacity?.from ?? 0;
  const opacityTo = opacity?.to ?? 1;
  const opacityExit = opacity?.exit ?? 0;
  const restValue = getAxisRestValue(enterFrom);

  return {
    initial: { opacity: opacityFrom, [axis]: enterFrom },
    animate: { opacity: opacityTo, [axis]: restValue },
    exit: { opacity: opacityExit, [axis]: exitTo },
    transition: reduceMotion
      ? REDUCED_MOTION_TRANSITION
      : { duration: durationMs / 1000, ease },
  };
}
