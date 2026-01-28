import styles from "./TierBoard.module.scss";
import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import { TierItemTile } from "./TierItemTile/TierItemTile";
type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

export function TierBoard({ state }: { state: RoomPublicState }) {
  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? ({} as Record<TierId, TierItemId[]>);

  return (
    <div
      className={styles.root}
      style={
        {
          ["--rowCount" as string]: tierOrder.length || 1,
        } as React.CSSProperties
      }
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
            style={
              tierColor
                ? ({
                    ["--tierColor" as string]: tierColor,
                  } as React.CSSProperties)
                : undefined
            }
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
