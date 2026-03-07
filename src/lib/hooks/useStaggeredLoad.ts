import { useEffect, useState } from "react";

type UseStaggeredLoadImagesOptions = {
  index: number;
  enabled?: boolean;
  immediateCount?: number;
  intervalMs?: number;
  maxDelayMs?: number;
};

type UseStaggeredLoadImagesResult = {
  shouldLoad: boolean;
  loading: "eager" | "lazy";
};

const DEFAULT_IMMEDIATE_COUNT = 2;
const DEFAULT_INTERVAL_MS = 110;
const DEFAULT_MAX_DELAY_MS = 2400;

/** Spreads out expensive mounts/loads by list index while keeping the first few immediate. */
export function useStaggeredLoadImages({
  index,
  enabled = true,
  immediateCount = DEFAULT_IMMEDIATE_COUNT,
  intervalMs = DEFAULT_INTERVAL_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
}: UseStaggeredLoadImagesOptions): UseStaggeredLoadImagesResult {
  const shouldLoadImmediately = !enabled || index < immediateCount;
  const loadKey = `${enabled ? "1" : "0"}:${index}:${immediateCount}`;

  const [readyKey, setReadyKey] = useState<string | null>(
    shouldLoadImmediately ? loadKey : null,
  );

  useEffect(
    function syncStaggeredLoad() {
      if (shouldLoadImmediately) return;

      const staggerOffset = index - immediateCount + 1;
      const delayMs = Math.min(maxDelayMs, staggerOffset * intervalMs);
      const timeoutId = window.setTimeout(() => {
        setReadyKey(loadKey);
      }, delayMs);

      return () => {
        window.clearTimeout(timeoutId);
      };
    },
    [
      immediateCount,
      index,
      intervalMs,
      loadKey,
      maxDelayMs,
      shouldLoadImmediately,
    ],
  );

  const shouldLoad = shouldLoadImmediately || readyKey === loadKey;

  return {
    shouldLoad,
    loading: shouldLoadImmediately ? "eager" : "lazy",
  };
}
