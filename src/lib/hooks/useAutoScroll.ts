import { useEffect, useRef } from "react";

interface UseAutoScrollOptions {
  top?: number;
  left?: number;
  behavior?: ScrollBehavior;
  enabled?: boolean;
  trigger?: boolean;
}

/**
 * Auto-scrolls the window based on either mount or a trigger.
 *
 * Behavior:
 * - If `trigger` is omitted, scroll runs once on mount.
 * - If `trigger` is provided, scroll does not run on mount and only runs when
 *   `trigger` changes from `false` to `true`.
 */
export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const {
    top = 0,
    left = 0,
    behavior = "auto",
    enabled = true,
    trigger,
  } = options;
  const hasInitializedRef = useRef(false);
  const previousTriggerRef = useRef<boolean | undefined>(undefined);

  useEffect(
    function scrollOnMountOrTriggerRise() {
      let frame: number | null = null;

      function scheduleScroll() {
        if (!enabled) return;
        frame = window.requestAnimationFrame(() => {
          window.scrollTo({ top, left, behavior });
        });
      }

      const hasTrigger = trigger !== undefined;

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        previousTriggerRef.current = trigger;

        if (!hasTrigger) scheduleScroll();
      } else if (hasTrigger) {
        const nextTrigger = trigger === true;
        const previousTrigger = previousTriggerRef.current === true;
        previousTriggerRef.current = trigger;

        if (!previousTrigger && nextTrigger) scheduleScroll();
      }

      return () => {
        if (frame !== null) window.cancelAnimationFrame(frame);
      };
    },
    [top, left, behavior, enabled, trigger],
  );
}
