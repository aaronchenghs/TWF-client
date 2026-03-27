import { startTransition, useEffect, useState } from "react";

/**
 * Flips to true shortly after the first paint so non-critical UI can mount
 * after the route shell becomes interactive.
 */
export function useDeferredReady(delayMs = 0) {
  const [isReady, setIsReady] = useState(false);

  useEffect(
    function scheduleDeferredReady() {
      if (isReady) return;

      let timeoutId: number | null = null;
      const frameId = window.requestAnimationFrame(() => {
        timeoutId = window.setTimeout(() => {
          startTransition(() => {
            setIsReady(true);
          });
        }, delayMs);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
      };
    },
    [delayMs, isReady],
  );

  return isReady;
}
