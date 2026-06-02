import { useEffect, useRef } from "react";
import styles from "./BackgroundGridEffect.module.scss";
import {
  BACKGROUND_GRID_LAYOUT,
  buildBackgroundGridTiles,
  canRenderBackgroundGridHover,
  createBackgroundGridPointerRenderState,
  createBackgroundGridPointerState,
  type BackgroundGridTile,
  getBackgroundGridRenderMetrics,
  getBackgroundGridTileStrokeStyle,
  haveBackgroundGridRenderMetricsChanged,
  isBackgroundGridHoverBlocked,
  type BackgroundGridRenderMetrics,
  type BackgroundGridPointerRenderState,
  type BackgroundGridPointerState,
  shouldContinueBackgroundGridAnimation,
  stepBackgroundGridPointerRenderState,
  strokeRoundedRect,
} from "@/lib/backgroundGridEffect";
import { useMobileView } from "@/lib/hooks/useMobileView";
import { useAppSelector, type AppState } from "@/store/store";

export function BackgroundGridEffect() {
  const isMobile = useMobileView();

  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const $isHighContrast = useAppSelector(
    (state: AppState) => state.userSettings.isHighContrast,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderMetricsRef = useRef<BackgroundGridRenderMetrics | null>(null);
  const gridTilesRef = useRef<BackgroundGridTile[]>([]);
  const pointerStateRef = useRef<BackgroundGridPointerState>(
    createBackgroundGridPointerState(),
  );
  const pointerRenderStateRef = useRef<BackgroundGridPointerRenderState>(
    createBackgroundGridPointerRenderState(),
  );

  useEffect(
    function drawBackgroundGridEffect() {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;

      renderMetricsRef.current = null;
      gridTilesRef.current = [];
      pointerStateRef.current = createBackgroundGridPointerState();
      pointerRenderStateRef.current = createBackgroundGridPointerRenderState();

      const context = canvas.getContext("2d");
      if (!context) return undefined;

      const canvasElement = canvas;
      const canvasContext = context;
      const staticCanvas = document.createElement("canvas");
      const staticContext = staticCanvas.getContext("2d");
      if (!staticContext) return undefined;

      const staticCanvasContext = staticContext;
      const isInteractive = !isMobile && !$isReduceMotion && !$isHighContrast;

      let frame = 0;

      function drawStaticGrid(metrics: BackgroundGridRenderMetrics) {
        staticCanvasContext.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
        staticCanvasContext.clearRect(
          0,
          0,
          metrics.viewportWidth,
          metrics.viewportHeight,
        );
        staticCanvasContext.lineWidth = BACKGROUND_GRID_LAYOUT.tileStrokeWidth;
        staticCanvasContext.strokeStyle = BACKGROUND_GRID_LAYOUT.baseTileColor;

        for (const tile of gridTilesRef.current) {
          strokeRoundedRect(
            staticCanvasContext,
            tile.x,
            tile.y,
            BACKGROUND_GRID_LAYOUT.tileWidth,
            BACKGROUND_GRID_LAYOUT.tileHeight,
            BACKGROUND_GRID_LAYOUT.tileRadius,
          );
        }
      }

      function resizeCanvas(
        targetCanvas: HTMLCanvasElement,
        metrics: BackgroundGridRenderMetrics,
      ) {
        targetCanvas.width = Math.round(metrics.viewportWidth * metrics.dpr);
        targetCanvas.height = Math.round(metrics.viewportHeight * metrics.dpr);
        targetCanvas.style.width = `${metrics.viewportWidth}px`;
        targetCanvas.style.height = `${metrics.viewportHeight}px`;
      }

      function rebuildGridTiles(metrics: BackgroundGridRenderMetrics) {
        gridTilesRef.current = buildBackgroundGridTiles({
          viewportWidth: metrics.viewportWidth,
          viewportHeight: metrics.viewportHeight,
          tileWidth: BACKGROUND_GRID_LAYOUT.tileWidth,
          tileHeight: BACKGROUND_GRID_LAYOUT.tileHeight,
          tileGap: BACKGROUND_GRID_LAYOUT.tileGap,
          gridOffsetY: BACKGROUND_GRID_LAYOUT.gridOffsetY,
          rowShiftX: BACKGROUND_GRID_LAYOUT.rowShiftX,
        });
      }

      function syncRenderSurface(): BackgroundGridRenderMetrics {
        const nextMetrics = getBackgroundGridRenderMetrics();

        if (
          !haveBackgroundGridRenderMetricsChanged(
            renderMetricsRef.current,
            nextMetrics,
          )
        )
          return nextMetrics;

        resizeCanvas(canvasElement, nextMetrics);
        resizeCanvas(staticCanvas, nextMetrics);
        renderMetricsRef.current = nextMetrics;
        rebuildGridTiles(nextMetrics);
        drawStaticGrid(nextMetrics);

        return nextMetrics;
      }

      function drawBaseLayer(metrics: BackgroundGridRenderMetrics) {
        canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        canvasContext.clearRect(
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        );
        canvasContext.imageSmoothingEnabled = false;
        canvasContext.drawImage(staticCanvas, 0, 0);
        canvasContext.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
      }

      function drawHoverLayer(
        pointerRenderState: BackgroundGridPointerRenderState,
      ) {
        canvasContext.lineWidth = BACKGROUND_GRID_LAYOUT.tileStrokeWidth;

        for (const tile of gridTilesRef.current) {
          const strokeStyle = getBackgroundGridTileStrokeStyle(
            tile,
            pointerRenderState,
          );
          if (!strokeStyle) continue;

          canvasContext.strokeStyle = strokeStyle;
          strokeRoundedRect(
            canvasContext,
            tile.x,
            tile.y,
            BACKGROUND_GRID_LAYOUT.tileWidth,
            BACKGROUND_GRID_LAYOUT.tileHeight,
            BACKGROUND_GRID_LAYOUT.tileRadius,
          );
        }
      }

      function drawScene() {
        frame = 0;

        const metrics = syncRenderSurface();
        drawBaseLayer(metrics);

        const pointerState = pointerStateRef.current;
        const pointerRenderState = pointerRenderStateRef.current;
        const intensityTarget = stepBackgroundGridPointerRenderState(
          pointerRenderState,
          pointerState,
        );

        if (canRenderBackgroundGridHover(isInteractive, pointerRenderState))
          drawHoverLayer(pointerRenderState);

        if (
          isInteractive &&
          shouldContinueBackgroundGridAnimation(
            pointerState,
            pointerRenderState,
            intensityTarget,
          )
        )
          frame = window.requestAnimationFrame(drawScene);
      }

      function queueDraw() {
        if (frame !== 0) return;
        frame = window.requestAnimationFrame(drawScene);
      }

      function handleMouseMove(event: MouseEvent) {
        pointerStateRef.current = {
          x: event.clientX,
          y: event.clientY,
          active: !isBackgroundGridHoverBlocked(event.target),
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

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
