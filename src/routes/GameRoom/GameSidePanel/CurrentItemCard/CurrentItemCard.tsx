import { useMemo } from "react";
import * as Contracts from "@twf/contracts";
import { CurrentItemDisplay } from "@/components/CurrentItemDisplay/CurrentItemDisplay";
import { ProgressBar } from "@/components/ProgressBar/ProgressBar";
import { SHOW_CURRENT_ITEM_PHASES } from "@/lib/tierItems";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";

type RoomPublicState = Contracts.RoomPublicState;
type TierItemId = Contracts.TierItemId;

type CurrentItemCardProps = {
  state: RoomPublicState;
};

export function CurrentItemCard({ state }: CurrentItemCardProps) {
  const currentItem = state.currentItem
    ? {
        name:
          state.itemMetaById?.[state.currentItem]?.name ?? state.currentItem,
        imageSrc: state.itemMetaById?.[state.currentItem]?.imageSrc,
      }
    : null;

  const currentItemProgress = useMemo(() => {
    if (!state.currentItem) return { index: null, total: null };

    const total = state.itemMetaById
      ? Object.keys(state.itemMetaById).length
      : null;
    if (!total) return { index: null, total: null };

    const placed = new Set<TierItemId>();
    Object.values(state.tiers ?? {}).forEach((items) => {
      items?.forEach((id) => placed.add(id));
    });

    const index = placed.size + (placed.has(state.currentItem) ? 0 : 1);
    return { index: Math.min(index, total), total };
  }, [state.currentItem, state.itemMetaById, state.tiers]);

  if (state.phase === "FINISHED") return null;

  const hasCurrentItemProgress =
    currentItemProgress.index != null && currentItemProgress.total != null;

  return (
    <GameStatusCard label="CURRENT ITEM:">
      <CurrentItemDisplay
        item={currentItem}
        isVisible={SHOW_CURRENT_ITEM_PHASES.has(state.phase)}
        textAlign="center"
      />
      {hasCurrentItemProgress && (
        <ProgressBar
          value={currentItemProgress.index}
          max={currentItemProgress.total}
          min={1}
          ariaLabel="Current item progress"
          ariaValueText={`Item ${currentItemProgress.index} of ${currentItemProgress.total}`}
        />
      )}
    </GameStatusCard>
  );
}
