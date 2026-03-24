import { clamp as radashiClamp } from "radashi";

export function clamp01(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return radashiClamp(value, 0, 1);
}
