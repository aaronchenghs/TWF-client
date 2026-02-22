import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "./TierBoard.module.scss";
import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "../../../components/MainTextTypography/MainTextTypography";
import { TierItemTile } from "./TierItemTile/TierItemTile";
import { useAutoFitText } from "../../../lib/hooks/useAutoFitText";
type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;
const MIN_TIER_LABEL_FONT_SIZE_PX = 26;
const SCALE_EPSILON = 0.001;
const MIN_BOARD_SCALE = 0.2;
const SCALE_SEARCH_STEPS = 14;
const FIT_BUFFER_PX = 10;
const SCALE_HEADROOM = 0.985;
const BOARD_SCALE_CSS_VAR = "--boardScale" as string;
const TIER_LABEL_COLOR_CSS_VAR = "--tierColor" as string;

export const TierBoard = memo(function TierBoard({
  state,
}: {
  state: RoomPublicState;
}) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const scaleRef = useRef(1);
  const isProbingRef = useRef(false);

  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? ({} as Record<TierId, TierItemId[]>);

  const measureBestScale = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return 1;

    const availableHeight = container.clientHeight;
    if (!availableHeight) return 1;
    const targetHeight = Math.max(0, availableHeight - FIT_BUFFER_PX);
    const renderedScale = scaleRef.current;

    const fitsAtScale = (candidateScale: number) => {
      content.style.setProperty(BOARD_SCALE_CSS_VAR, String(candidateScale));
      const unscaledHeight = content.scrollHeight;
      const visualHeight = unscaledHeight * candidateScale;
      return visualHeight <= targetHeight;
    };

    let bestScale = MIN_BOARD_SCALE;

    isProbingRef.current = true;
    try {
      if (fitsAtScale(1)) {
        bestScale = 1;
      } else {
        let low = MIN_BOARD_SCALE;
        let high = 1;

        for (let i = 0; i < SCALE_SEARCH_STEPS; i += 1) {
          const mid = (low + high) / 2;
          if (fitsAtScale(mid)) {
            bestScale = mid;
            low = mid;
          } else {
            high = mid;
          }
        }
      }
    } finally {
      // Restore the currently rendered scale; React owns the persistent style value.
      content.style.setProperty(BOARD_SCALE_CSS_VAR, String(renderedScale));
      isProbingRef.current = false;
    }

    const adjustedScale =
      bestScale >= 1
        ? 1
        : Math.max(MIN_BOARD_SCALE, bestScale * SCALE_HEADROOM);

    return Number(adjustedScale.toFixed(4));
  }, []);

  const scheduleScaleMeasure = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const nextScale = measureBestScale();
      setScale((prev) =>
        Math.abs(prev - nextScale) > SCALE_EPSILON ? nextScale : prev,
      );
    });
  }, [measureBestScale]);

  useLayoutEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useLayoutEffect(() => {
    scheduleScaleMeasure();
  }, [state, scheduleScaleMeasure]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const onResize = () => {
      if (isProbingRef.current) return;
      scheduleScaleMeasure();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    ro.observe(content);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [scheduleScaleMeasure]);

  return (
    <div className={styles.root} ref={containerRef}>
      <div
        className={styles.scale}
        ref={contentRef}
        style={{ [BOARD_SCALE_CSS_VAR]: scale }}
      >
        {tierOrder.map((tierId) => {
          const items = tiers[tierId] ?? [];
          const isPending = state.pendingTierId === tierId;
          const tierMeta = state.tierMetaById?.[tierId];
          const tierColor = tierMeta?.color;

          return (
            <div
              key={tierId}
              className={clsx(styles.row, isPending && styles.pending)}
              style={{ [TIER_LABEL_COLOR_CSS_VAR]: tierColor }}
            >
              <div className={styles.tierLabel}>
                <TierLabelText label={tierMeta?.name ?? tierId} />
              </div>

              <div className={styles.items}>
                {items.map((id) => (
                  <TierItemTile key={id} state={state} itemId={id} />
                ))}

                {isPending && state.currentItem ? (
                  <TierItemTile
                    state={state}
                    itemId={state.currentItem}
                    ghost
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const TierLabelText = memo(function TierLabelText({
  label,
}: {
  label: string;
}) {
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useAutoFitText(labelRef, {
    minFontSizePx: MIN_TIER_LABEL_FONT_SIZE_PX,
    watch: label,
    enabled: label.length > 0,
  });

  return (
    <MainTextTypography
      variant="h2"
      weight="bold"
      textAlign="center"
      className={styles.tierLabelText}
      ref={labelRef}
    >
      {label}
    </MainTextTypography>
  );
});
