import * as Contracts from "@twf/contracts";
type RoomPublicState = Contracts.RoomPublicState;
type TierItemId = Contracts.TierItemId;

function fallbackNameFromId(id: string) {
  return id.replace(/[-_]/g, " ").trim();
}

export function getItemMeta(
  state: RoomPublicState,
  id: TierItemId
): { name: string; imageSrc?: string } {
  const meta = state.itemMetaById?.[id];
  return {
    name: meta?.name ?? fallbackNameFromId(id),
    imageSrc: meta?.imageSrc,
  };
}
