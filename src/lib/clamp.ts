export function clamp(
  value: number,
  min: number,
  max: number,
  fallback = min,
): number {
  if (!Number.isFinite(value)) return fallback;
  if (max < min) return min;

  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number, fallback = 0): number {
  return clamp(value, 0, 1, fallback);
}
