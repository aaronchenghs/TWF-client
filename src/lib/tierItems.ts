import * as Contracts from "@twf/contracts";
type RoomPublicState = Contracts.RoomPublicState;
type TierItemId = Contracts.TierItemId;
type TierId = Contracts.TierId;

export const SHOW_CURRENT_ITEM_PHASES = new Set<RoomPublicState["phase"]>([
  "VOTE",
  "FINISHED",
  "RESOLVE",
  "RESULTS",
]);

function fallbackNameFromId(id: string) {
  return id.replace(/[-_]/g, " ").trim();
}

const ITEM_COUNT_COLOR_MIN = 4;
const ITEM_COUNT_COLOR_RANGE = 32;
const ITEM_COUNT_HUE_GREEN = 130;
const ITEM_COUNT_HUE_YELLOW = 56;
export function getTierSetItemCountAccentColor(itemCount: number): string {
  const heat = Math.min(
    1,
    Math.max(0, (itemCount - ITEM_COUNT_COLOR_MIN) / ITEM_COUNT_COLOR_RANGE),
  );
  const hue = Math.round(
    ITEM_COUNT_HUE_GREEN -
      heat * (ITEM_COUNT_HUE_GREEN - ITEM_COUNT_HUE_YELLOW),
  );
  return `hsl(${hue} 64% 60%)`;
}

export function getItemMeta(
  state: RoomPublicState,
  id: TierItemId,
): { name: string; imageSrc?: string } {
  const meta = state.itemMetaById?.[id];
  return {
    name: meta?.name ?? fallbackNameFromId(id),
    imageSrc: meta?.imageSrc,
  };
}

/**
 * Reliable rule aligned with TierBoard rendering:
 * - During placement, the authoritative "where the player put it" is pendingTierId.
 * - At vote start, the placed item may not yet be in tiers (depending on server timing),
 *   but pendingTierId is already set.
 * - Fallback: scan tiers to find the item (works once server has committed).
 */
export function resolvePlacedTierId(
  state: RoomPublicState | null,
  itemId: TierItemId | null | undefined,
): TierId | null {
  if (!state || !itemId) return null;

  // 1) Most reliable: the tier the current player selected for this item.
  if (state.pendingTierId) return state.pendingTierId;

  // 2) Fallback: item already committed into tiers (scan by tierOrder).
  const tierOrder = state.tierOrder ?? [];
  const tiers = (state.tiers ?? ({} as Record<TierId, TierItemId[]>)) as Record<
    TierId,
    TierItemId[]
  >;

  for (const tierId of tierOrder) {
    const items = tiers[tierId] ?? [];
    if (items.includes(itemId)) return tierId;
  }

  // 3) Last fallback: if tierOrder is empty for some reason, scan all keys.
  for (const tierId of Object.keys(tiers) as TierId[]) {
    const items = tiers[tierId] ?? [];
    if (items.includes(itemId)) return tierId;
  }

  return null;
}
