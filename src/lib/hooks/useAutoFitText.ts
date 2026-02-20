import { type RefObject, useEffect } from "react";

interface UseAutoFitTextOptions {
  minFontSizePx?: number;
  enabled?: boolean;
  watch?: unknown;
}

const DEFAULT_MIN_FONT_SIZE_PX = 12;

export function useAutoFitText(
  textRef: RefObject<HTMLElement | null>,
  options: UseAutoFitTextOptions = {},
) {
  const {
    minFontSizePx = DEFAULT_MIN_FONT_SIZE_PX,
    enabled = true,
    watch,
  } = options;

  useEffect(
    function autoFitTextToCurrentWidth() {
      if (!enabled) return;

      const textEl = textRef.current;
      if (!textEl) return;

      let frame = 0;

      const fitText = () => {
        textEl.style.fontSize = "";

        const availableWidth = textEl.clientWidth;
        if (availableWidth <= 0) return;

        const naturalWidth = textEl.scrollWidth;
        if (naturalWidth <= availableWidth) return;

        const baseSizePx = Number.parseFloat(
          window.getComputedStyle(textEl).fontSize,
        );
        if (!Number.isFinite(baseSizePx) || baseSizePx <= 0) return;

        let fittedSizePx = Math.max(
          minFontSizePx,
          (baseSizePx * availableWidth) / naturalWidth,
        );

        textEl.style.fontSize = `${fittedSizePx}px`;

        if (
          textEl.scrollWidth > textEl.clientWidth &&
          fittedSizePx > minFontSizePx
        ) {
          fittedSizePx = Math.max(
            minFontSizePx,
            (fittedSizePx * textEl.clientWidth) / textEl.scrollWidth,
          );
          textEl.style.fontSize = `${fittedSizePx}px`;
        }
      };

      const scheduleFit = () => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(fitText);
      };

      scheduleFit();

      const resizeObserver = new ResizeObserver(scheduleFit);
      resizeObserver.observe(textEl);

      document.fonts?.ready.then(scheduleFit).catch(() => undefined);

      return () => {
        window.cancelAnimationFrame(frame);
        resizeObserver.disconnect();
      };
    },
    [textRef, minFontSizePx, enabled, watch],
  );
}
