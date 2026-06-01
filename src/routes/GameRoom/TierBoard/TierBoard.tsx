import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "./TierBoard.module.scss";
import type { RoomPublicState, TierId, TierItemId } from "@twf/contracts";
import { computeVoteResolution } from "@/lib/voting";
import { TierRow } from "./TierRow/TierRow";

const SCALE_EPSILON = 0.001;
const MIN_BOARD_SCALE = 0.2;
const SCALE_SEARCH_STEPS = 14;
const FIT_BUFFER_PX = 10;
const SCALE_HEADROOM = 0.985;
const BOARD_SCALE_CSS_VAR = "--boardScale" as string;

type TierBoardProps = {
  state: RoomPublicState;
  showItemNames: boolean;
};

export const TierBoard = memo(function TierBoard({
  state,
  showItemNames,
}: TierBoardProps) {
  const [scale, setScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const scaleRef = useRef(1);
  const isProbingRef = useRef(false);

  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? ({} as Record<TierId, TierItemId[]>);
  const isVotePhase = state.phase === "VOTE";
  const isResultsPhase = state.phase === "RESULTS";

  const voteGhostResolution =
    state.currentItem && state.pendingTierId
      ? isVotePhase
        ? computeVoteResolution({
            votes: state.votes ?? {},
            eligibleVoterIds: state.players
              .filter(
                (p) =>
                  p.connected !== false && p.id !== state.currentTurnPlayerId,
              )
              .map((p) => p.id),
            fromTierId: state.pendingTierId,
            tierOrder,
            tiers,
            currentItemId: state.currentItem,
          })
        : isResultsPhase && state.lastResolution
          ? state.lastResolution
          : null
      : null;

  const ghostTierId = voteGhostResolution?.toTierId ?? null;
  const ghostInsertIndex = voteGhostResolution?.insertIndex ?? null;

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
    <section className={styles.boardSection}>
      <div className={styles.root} ref={containerRef}>
        <div
          className={styles.scale}
          ref={contentRef}
          style={{ [BOARD_SCALE_CSS_VAR]: scale }}
        >
          {tierOrder.map((tierId) => (
            <TierRow
              key={tierId}
              state={state}
              showItemNames={showItemNames}
              tierId={tierId}
              ghostTierId={ghostTierId}
              ghostInsertIndex={ghostInsertIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
