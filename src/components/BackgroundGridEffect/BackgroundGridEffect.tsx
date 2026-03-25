import { useEffect, useRef } from "react";
import styles from "./BackgroundGridEffect.module.scss";
import {
  BACKGROUND_GRID_PALETTE_RGB,
  buildBackgroundGridTiles,
  type BackgroundGridTile,
  getBackgroundGridAreaColorIndex,
  getBackgroundGridRevealAlpha,
  strokeRoundedRect,
} from "@/lib/backgroundGridEffect";
import { useMobileView } from "@/lib/hooks/useMobileView";
import { useAppSelector, type AppState } from "@/store/store";

const TILE_WIDTH = 40;
const TILE_HEIGHT = 14;
const TILE_GAP = 4;
const TILE_RADIUS = 1;
const TILE_STROKE_WIDTH = 1;
const HOVER_RADIUS = 70;
const GRID_OFFSET_Y = 0;
const ROW_SHIFT_X = 20;
const BASE_TILE_COLOR = "rgba(255, 255, 255, 0.04)";

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

type GridRenderMetrics = {
  viewportWidth: number;
  viewportHeight: number;
  dpr: number;
};

export function BackgroundGridEffect() {
  const isMobile = useMobileView();

  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const $isHighContrast = useAppSelector(
    (state: AppState) => state.userSettings.isHighContrast,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderMetricsRef = useRef<GridRenderMetrics | null>(null);
  const gridTilesRef = useRef<BackgroundGridTile[]>([]);
  const pointerStateRef = useRef<PointerState>({
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    active: false,
  });

  useEffect(
    function drawBackgroundGridEffect() {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      renderMetricsRef.current = null;
      gridTilesRef.current = [];

      const context = canvas.getContext("2d");
      if (!context) return undefined;
      const canvasElement = canvas;
      const canvasContext = context;
      const staticCanvas = document.createElement("canvas");
      const staticContext = staticCanvas.getContext("2d");
      if (!staticContext) return undefined;
      const staticCanvasContext = staticContext;

      let frame = 0;

      function syncRenderSurface(): GridRenderMetrics {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        const previousMetrics = renderMetricsRef.current;

        if (
          previousMetrics &&
          previousMetrics.viewportWidth === viewportWidth &&
          previousMetrics.viewportHeight === viewportHeight &&
          previousMetrics.dpr === dpr
        )
          return previousMetrics;

        canvasElement.width = Math.round(viewportWidth * dpr);
        canvasElement.height = Math.round(viewportHeight * dpr);
        canvasElement.style.width = `${viewportWidth}px`;
        canvasElement.style.height = `${viewportHeight}px`;

        staticCanvas.width = Math.round(viewportWidth * dpr);
        staticCanvas.height = Math.round(viewportHeight * dpr);
        staticCanvas.style.width = `${viewportWidth}px`;
        staticCanvas.style.height = `${viewportHeight}px`;

        const nextMetrics = {
          viewportWidth,
          viewportHeight,
          dpr,
        } satisfies GridRenderMetrics;

        renderMetricsRef.current = nextMetrics;
        gridTilesRef.current = buildBackgroundGridTiles({
          viewportWidth,
          viewportHeight,
          tileWidth: TILE_WIDTH,
          tileHeight: TILE_HEIGHT,
          tileGap: TILE_GAP,
          gridOffsetY: GRID_OFFSET_Y,
          rowShiftX: ROW_SHIFT_X,
        });

        staticCanvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        staticCanvasContext.clearRect(0, 0, viewportWidth, viewportHeight);
        staticCanvasContext.lineWidth = TILE_STROKE_WIDTH;
        staticCanvasContext.strokeStyle = BASE_TILE_COLOR;

        for (const tile of gridTilesRef.current) {
          strokeRoundedRect(
            staticCanvasContext,
            tile.x,
            tile.y,
            TILE_WIDTH,
            TILE_HEIGHT,
            TILE_RADIUS,
          );
        }

        return nextMetrics;
      }

      function drawScene() {
        frame = 0;

        const { dpr } = syncRenderSurface();
        canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        canvasContext.clearRect(
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        );
        canvasContext.imageSmoothingEnabled = false;
        canvasContext.drawImage(staticCanvas, 0, 0);
        canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);

        const pointerState = pointerStateRef.current;
        const isInteractive = !isMobile && !$isReduceMotion && !$isHighContrast;

        if (!isInteractive || !pointerState.active) return;

        canvasContext.lineWidth = TILE_STROKE_WIDTH;

        for (const tile of gridTilesRef.current) {
          const distance = Math.hypot(
            tile.centerX - pointerState.x,
            tile.centerY - pointerState.y,
          );

          if (distance >= HOVER_RADIUS) continue;

          const colorIndex = getBackgroundGridAreaColorIndex(
            tile.column,
            tile.row,
          );
          const [red, green, blue] = BACKGROUND_GRID_PALETTE_RGB[colorIndex] ??
            BACKGROUND_GRID_PALETTE_RGB[0] ?? [255, 255, 255];
          const alpha = getBackgroundGridRevealAlpha(distance, HOVER_RADIUS);

          canvasContext.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
          strokeRoundedRect(
            canvasContext,
            tile.x,
            tile.y,
            TILE_WIDTH,
            TILE_HEIGHT,
            TILE_RADIUS,
          );
        }
      }

      function queueDraw() {
        if (frame !== 0) return;
        frame = window.requestAnimationFrame(drawScene);
      }

      function handleMouseMove(event: MouseEvent) {
        pointerStateRef.current = {
          x: event.clientX,
          y: event.clientY,
          active: true,
        };
        queueDraw();
      }

      function hideHover() {
        pointerStateRef.current = {
          ...pointerStateRef.current,
          active: false,
        };
        queueDraw();
      }

      function handleMouseOut(event: MouseEvent) {
        if (event.relatedTarget !== null) return;
        hideHover();
      }

      drawScene();

      window.addEventListener("resize", queueDraw);

      if (!isMobile) {
        window.addEventListener("mousemove", handleMouseMove, {
          passive: true,
        });
        window.addEventListener("mouseout", handleMouseOut, { passive: true });
        window.addEventListener("blur", hideHover);
      }

      return () => {
        window.removeEventListener("resize", queueDraw);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseout", handleMouseOut);
        window.removeEventListener("blur", hideHover);
        window.cancelAnimationFrame(frame);
        renderMetricsRef.current = null;
        gridTilesRef.current = [];
      };
    },
    [$isHighContrast, $isReduceMotion, isMobile],
  );

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
