import { clamp01 } from "@/lib/clamp";
import { DEFAULT_TIER_COLORS, hexToRgb } from "@/lib/constants/colors";

export const BACKGROUND_GRID_LAYOUT = {
  tileWidth: 40,
  tileHeight: 14,
  tileGap: 4,
  tileRadius: 1,
  tileStrokeWidth: 1,
  hoverRadius: 70,
  gridOffsetY: 0,
  rowShiftX: 20,
  baseTileColor: "rgba(255, 255, 255, 0.04)",
} as const;

const BACKGROUND_GRID_POINTER_POSITION_EASING = 0.22;
const BACKGROUND_GRID_POINTER_INTENSITY_EASING = 0.18;
const BACKGROUND_GRID_POINTER_POSITION_SETTLE_THRESHOLD = 0.4;
const BACKGROUND_GRID_POINTER_INTENSITY_SETTLE_THRESHOLD = 0.02;
const BACKGROUND_GRID_POINTER_VISIBLE_INTENSITY_THRESHOLD = 0.01;
const BACKGROUND_GRID_HOVER_BLOCK_SELECTOR = [
  "button",
  "input[type='range']",
  "[role='button']",
  "[role='switch']",
  "[data-bg-hover-block]",
].join(", ");

export const BACKGROUND_GRID_PALETTE = Array.from(DEFAULT_TIER_COLORS);
export const BACKGROUND_GRID_PALETTE_RGB =
  BACKGROUND_GRID_PALETTE.map(hexToRgb);

export type BackgroundGridPointerState = {
  x: number;
  y: number;
  active: boolean;
};

export type BackgroundGridPointerRenderState = {
  x: number;
  y: number;
  intensity: number;
};

export type BackgroundGridRenderMetrics = {
  viewportWidth: number;
  viewportHeight: number;
  dpr: number;
};

export type BackgroundGridTile = {
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  column: number;
  row: number;
};

/** Creates the live pointer target that the hover effect follows. */
export function createBackgroundGridPointerState(
  active = false,
): BackgroundGridPointerState {
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    active,
  };
}

/** Creates the eased pointer state used for the rendered hover trail. */
export function createBackgroundGridPointerRenderState(): BackgroundGridPointerRenderState {
  const { x, y } = createBackgroundGridPointerState();
  return {
    x,
    y,
    intensity: 0,
  };
}

/** Reads the current viewport size and device pixel ratio for the canvas. */
export function getBackgroundGridRenderMetrics(): BackgroundGridRenderMetrics {
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
}

/** Tells the renderer when cached canvas dimensions need to be rebuilt. */
export function haveBackgroundGridRenderMetricsChanged(
  previousMetrics: BackgroundGridRenderMetrics | null,
  nextMetrics: BackgroundGridRenderMetrics,
) {
  if (!previousMetrics) return true;

  return (
    previousMetrics.viewportWidth !== nextMetrics.viewportWidth ||
    previousMetrics.viewportHeight !== nextMetrics.viewportHeight ||
    previousMetrics.dpr !== nextMetrics.dpr
  );
}

/** Draws a thin rounded rectangle tile onto the canvas. */
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

/** Picks a stable tier color for a grid area using a soft wave pattern. */
export function getBackgroundGridAreaColorIndex(
  gridColumn: number,
  gridRow: number,
): number {
  const zoneX = gridColumn * 0.32;
  const zoneY = gridRow * 0.3;
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

/** Calculates a tile's reveal strength based on cursor distance. */
export function getBackgroundGridRevealAlpha(
  distance: number,
  radius: number,
): number {
  const distanceMix = 1 - clamp01(distance / radius, 1);
  const softenedMix = distanceMix * distanceMix * (3 - 2 * distanceMix);
  return 0.1 + softenedMix * 0.8;
}

/** Eases the rendered pointer state toward the latest pointer target. */
export function stepBackgroundGridPointerRenderState(
  pointerRenderState: BackgroundGridPointerRenderState,
  pointerState: BackgroundGridPointerState,
) {
  const intensityTarget = pointerState.active ? 1 : 0;

  pointerRenderState.x +=
    (pointerState.x - pointerRenderState.x) *
    BACKGROUND_GRID_POINTER_POSITION_EASING;
  pointerRenderState.y +=
    (pointerState.y - pointerRenderState.y) *
    BACKGROUND_GRID_POINTER_POSITION_EASING;
  pointerRenderState.intensity +=
    (intensityTarget - pointerRenderState.intensity) *
    BACKGROUND_GRID_POINTER_INTENSITY_EASING;

  return intensityTarget;
}

/** Indicates whether the hover animation still has visible motion left. */
export function shouldContinueBackgroundGridAnimation(
  pointerState: BackgroundGridPointerState,
  pointerRenderState: BackgroundGridPointerRenderState,
  intensityTarget: number,
) {
  return (
    Math.abs(pointerState.x - pointerRenderState.x) >
      BACKGROUND_GRID_POINTER_POSITION_SETTLE_THRESHOLD ||
    Math.abs(pointerState.y - pointerRenderState.y) >
      BACKGROUND_GRID_POINTER_POSITION_SETTLE_THRESHOLD ||
    Math.abs(intensityTarget - pointerRenderState.intensity) >
      BACKGROUND_GRID_POINTER_INTENSITY_SETTLE_THRESHOLD
  );
}

/** Skips hover drawing when the effect is disabled or fully faded out. */
export function canRenderBackgroundGridHover(
  isInteractive: boolean,
  pointerRenderState: BackgroundGridPointerRenderState,
) {
  return (
    isInteractive &&
    pointerRenderState.intensity >
      BACKGROUND_GRID_POINTER_VISIBLE_INTENSITY_THRESHOLD
  );
}

/** Returns the hover stroke color for a tile, or `null` when it is out of range. */
export function getBackgroundGridTileStrokeStyle(
  tile: BackgroundGridTile,
  pointerRenderState: BackgroundGridPointerRenderState,
) {
  const distance = Math.hypot(
    tile.centerX - pointerRenderState.x,
    tile.centerY - pointerRenderState.y,
  );

  if (distance >= BACKGROUND_GRID_LAYOUT.hoverRadius) return null;

  const colorIndex = getBackgroundGridAreaColorIndex(tile.column, tile.row);
  const [red, green, blue] = BACKGROUND_GRID_PALETTE_RGB[colorIndex] ??
    BACKGROUND_GRID_PALETTE_RGB[0] ?? [255, 255, 255];
  const alpha =
    getBackgroundGridRevealAlpha(distance, BACKGROUND_GRID_LAYOUT.hoverRadius) *
    pointerRenderState.intensity;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** Prevents the background effect from reacting under interactive controls. */
export function isBackgroundGridHoverBlocked(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return target.closest(BACKGROUND_GRID_HOVER_BLOCK_SELECTOR) !== null;
}

/** Builds the staggered tile layout that fills and over-scans the viewport. */
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
