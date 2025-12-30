import styles from "./TierBoard.module.scss";
import clsx from "clsx";
import type { RoomPublicState, TierId } from "@twf/contracts";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";

export function TierBoard({ state }: { state: RoomPublicState }) {
  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? ({} as Record<TierId, string[]>);

  return (
    <div className={styles.root}>
      {tierOrder.map((tierId) => {
        const items = tiers[tierId] ?? [];
        const isPending = state.pendingTierId === tierId;

        return (
          <div
            key={tierId}
            className={clsx(styles.row, isPending && styles.pending)}
          >
            <div className={styles.tierLabel}>
              <MainTextTypography variant="h5" weight="bold">
                {tierId}
              </MainTextTypography>
            </div>

            <div className={styles.items}>
              {items.length === 0 ? (
                <MainTextTypography variant="body" muted>
                  —
                </MainTextTypography>
              ) : (
                items.map((it) => (
                  <div key={it} className={styles.itemPill} title={it}>
                    <MainTextTypography variant="caption" weight="medium">
                      {it}
                    </MainTextTypography>
                  </div>
                ))
              )}

              {/* “ghost” placement hint for pending tier */}
              {isPending && state.currentItem ? (
                <div
                  className={clsx(styles.itemPill, styles.ghost)}
                  title={state.currentItem}
                >
                  <MainTextTypography variant="caption" weight="medium">
                    {state.currentItem}
                  </MainTextTypography>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
