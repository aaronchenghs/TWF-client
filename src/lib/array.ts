/** Normalizes any index into the valid `[0, length - 1]` range for circular arrays. */
export function normalizeCircularIndex(index: number, length: number): number {
  if (!Number.isFinite(index)) return 0;
  if (!Number.isFinite(length) || length <= 0) return 0;

  const integerIndex = Number.isInteger(index) ? index : Math.trunc(index);
  const integerLength = Math.trunc(length);
  return ((integerIndex % integerLength) + integerLength) % integerLength;
}

/** Orders items by `ids`, then appends any remaining items in their original order. */
export function orderByIdsKeepingExtras<
  TId extends string,
  T extends { id: TId },
>(items: readonly T[], ids: readonly TId[]): T[] {
  if (items.length <= 1) return [...items];
  if (ids.length === 0) return [...items];

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const orderedItems: T[] = [];

  for (const id of ids) {
    const item = itemsById.get(id);
    if (!item) continue;
    orderedItems.push(item);
    itemsById.delete(id);
  }

  for (const item of items) {
    if (!itemsById.has(item.id)) continue;
    orderedItems.push(item);
    itemsById.delete(item.id);
  }

  return orderedItems;
}
