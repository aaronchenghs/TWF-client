export const DEFAULT_TIER_COLORS: Set<string> = new Set([
  "#E53935",
  "#FB8C00",
  "#FDD835",
  "#43A047",
  "#1E88E5",
]);

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
