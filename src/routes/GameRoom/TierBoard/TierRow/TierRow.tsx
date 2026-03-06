import { memo, useRef } from "react";
import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import styles from "./TierRow.module.scss";
import { MainTextTypography } from "../../../../components/MainTextTypography/MainTextTypography";
import { useAutoFitText } from "../../../../lib/hooks/useAutoFitText";
import { TierItemTile } from "./TierItemTile/TierItemTile";

type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;

const MIN_TIER_LABEL_FONT_SIZE_PX = 26;
const TIER_LABEL_COLOR_CSS_VAR = "--tierColor" as string;

type TierRowProps = {
  state: RoomPublicState;
  tierId: TierId;
  ghostTierId: TierId | null;
  ghostInsertIndex: number | null;
};

export const TierRow = memo(function TierRow({
  state,
  tierId,
  ghostTierId,
  ghostInsertIndex,
}: TierRowProps) {
  const isVotePhase = state.phase === "VOTE";
  const isResultsPhase = state.phase === "RESULTS";
  const items = state.tiers?.[tierId] ?? [];
  const isPending =
    (isVotePhase || state.phase === "PLACE") && state.pendingTierId === tierId;
  const isGhostTier = ghostTierId === tierId;
  const isPreviewFilled = isVotePhase && isGhostTier;

  const tierMeta = state.tierMetaById?.[tierId];
  const tierColor = tierMeta?.color;
  const safeItems = state.currentItem
    ? items.filter((id) => id !== state.currentItem)
    : items;
  const safeGhostIndex =
    isGhostTier && typeof ghostInsertIndex === "number"
      ? Math.min(Math.max(0, ghostInsertIndex), safeItems.length)
      : null;

  return (
    <div
      className={clsx(
        styles.row,
        isPending && styles.pending,
        isPreviewFilled && styles.previewFill,
        isVotePhase && isGhostTier && !isPending && styles.ghostTarget,
        isResultsPhase && isGhostTier && styles.resultReveal,
      )}
      style={{ [TIER_LABEL_COLOR_CSS_VAR]: tierColor }}
    >
      <div className={styles.tierLabel}>
        <TierLabelText label={tierMeta?.name ?? tierId} />
      </div>

      <div className={styles.items}>
        {(safeGhostIndex === null
          ? safeItems
          : safeItems.slice(0, safeGhostIndex)
        ).map((id) => (
          <TierItemTile key={id} state={state} itemId={id} />
        ))}

        {isGhostTier && state.currentItem && (
          <TierItemTile
            state={state}
            itemId={state.currentItem}
            ghost
            isGhostSolidifying={isResultsPhase}
          />
        )}

        {safeGhostIndex !== null &&
          safeItems
            .slice(safeGhostIndex)
            .map((id) => <TierItemTile key={id} state={state} itemId={id} />)}
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
