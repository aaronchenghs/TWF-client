import { clamp01 } from "@/lib/clamp";
import { DEFAULT_TIER_COLORS } from "@/lib/constants/colors";

export const BACKGROUND_GRID_PALETTE = Array.from(DEFAULT_TIER_COLORS);
export const BACKGROUND_GRID_PALETTE_RGB =
  BACKGROUND_GRID_PALETTE.map(hexToRgb);

export type BackgroundGridTile = {
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  column: number;
  row: number;
};

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.stroke();
}

export function getBackgroundGridAreaColorIndex(
  gridColumn: number,
  gridRow: number,
): number {
  const zoneX = gridColumn * 0.32;
  const zoneY = gridRow * 0.28;
  const wave =
    Math.sin(zoneX) +
    Math.cos(zoneY * 1.2) +
    Math.sin((zoneX + zoneY) * 0.75) * 0.8 +
    Math.cos((zoneX - zoneY) * 0.4) * 0.6;
  const normalized = clamp01((wave + 3.5) / 6.5);
  return Math.min(
    BACKGROUND_GRID_PALETTE.length - 1,
    Math.floor(normalized * BACKGROUND_GRID_PALETTE.length),
  );
}

export function getBackgroundGridRevealAlpha(
  distance: number,
  radius: number,
): number {
  const distanceMix = 1 - clamp01(distance / radius, 1);
  const softenedMix = distanceMix * distanceMix * (3 - 2 * distanceMix);
  return 0.1 + softenedMix * 0.9;
}

export function buildBackgroundGridTiles({
  viewportWidth,
  viewportHeight,
  tileWidth,
  tileHeight,
  tileGap,
  gridOffsetY,
  rowShiftX,
}: {
  viewportWidth: number;
  viewportHeight: number;
  tileWidth: number;
  tileHeight: number;
  tileGap: number;
  gridOffsetY: number;
  rowShiftX: number;
}): BackgroundGridTile[] {
  const tiles: BackgroundGridTile[] = [];
  const stepX = tileWidth + tileGap;
  const stepY = tileHeight + tileGap;

  for (
    let row = 0, y = gridOffsetY;
    y < viewportHeight + stepY;
    row += 1, y += stepY
  ) {
    const rowOffsetX = (row % 2 === 1 ? rowShiftX : 0) - rowShiftX;
    for (
      let column = 0, x = rowOffsetX;
      x < viewportWidth + stepX;
      column += 1, x += stepX
    ) {
      tiles.push({
        x,
        y,
        centerX: x + tileWidth * 0.5,
        centerY: y + tileHeight * 0.5,
        column,
        row,
      });
    }
  }

  return tiles;
}
