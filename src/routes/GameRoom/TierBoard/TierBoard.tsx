import { memo, useLayoutEffect, useRef, useState } from "react";
import styles from "./TierBoard.module.scss";
import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "../../../components/MainTextTypography/MainTextTypography";
import { TierItemTile } from "./TierItemTile/TierItemTile";
type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

export const TierBoard = memo(function TierBoard({
  state,
}: {
  state: RoomPublicState;
}) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? ({} as Record<TierId, TierItemId[]>);

  useLayoutEffect(function measureBoardScale() {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    let frame = 0;
    const updateScale = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const availableHeight = container.clientHeight;
        const availableWidth = container.clientWidth;
        const contentHeight = content.scrollHeight;
        const contentWidth = content.scrollWidth;
        if (
          !availableHeight ||
          !availableWidth ||
          !contentHeight ||
          !contentWidth
        ) {
          return;
        }

        const nextScale = Math.min(
          1,
          availableHeight / contentHeight,
          availableWidth / contentWidth,
        );

        setScale((prev) =>
          Math.abs(prev - nextScale) > 0.01 ? nextScale : prev,
        );
      });
    };

    updateScale();

    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    ro.observe(content);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={styles.root} ref={containerRef}>
      <div
        className={styles.scale}
        ref={contentRef}
        style={{ ["--boardScale" as string]: scale }}
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
              style={{ ["--tierColor" as string]: tierColor }}
            >
              <div className={styles.tierLabel}>
                <MainTextTypography variant="h5" weight="bold">
                  {tierMeta?.name ?? tierId}
                </MainTextTypography>
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
