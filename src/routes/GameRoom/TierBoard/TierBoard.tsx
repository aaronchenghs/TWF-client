import styles from "./TierBoard.module.scss";
import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "../../../components/MainTextTypography/MainTextTypography";
import { TierItemTile } from "./TierItemTile/TierItemTile";
type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

export function TierBoard({ state }: { state: RoomPublicState }) {
  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? ({} as Record<TierId, TierItemId[]>);

  return (
    <div className={styles.root}>
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
                <TierItemTile state={state} itemId={state.currentItem} ghost />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
