import { clamp as radashiClamp } from "radashi";

export function clamp01(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return radashiClamp(value, 0, 1);
}

export function clampPositiveInteger(value: number, fallback = 1): number {
  const normalizedFallback =
    Number.isFinite(fallback) && fallback > 0 ? Math.floor(fallback) : 1;
  if (!Number.isFinite(value)) return normalizedFallback;
  return Math.max(1, Math.floor(value));
}
