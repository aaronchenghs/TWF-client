import { useMemo } from "react";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";
import type { Tier } from "@twf/contracts";

export function PlaceControls(props: {
  tiers: Tier[];
  tierOrder: string[];
  disabled: boolean;
  onPlace: (tierId: string) => void;
}) {
  const { tiers, tierOrder, disabled, onPlace } = props;

  const tierById = useMemo(() => {
    const m = new Map<string, Tier>();
    for (const t of tiers) m.set(t.id, t);
    return m;
  }, [tiers]);

  const orderedTierIds = tierOrder.length
    ? tierOrder
    : tiers.map((tier) => tier.id);

  if (disabled) return <AwaitingControls />;
  return (
    <div className={styles.controls}>
      <MainTextTypography
        variant="label"
        muted
        letterSpacing="wide"
        className={styles.controlsLabel}
      >
        {`PLACE INTO: `}
      </MainTextTypography>

      <div className={styles.grid2}>
        {orderedTierIds.map((tierId) => {
          const tier = tierById.get(tierId);
          const label = tier?.name ?? tierId;
          return (
            <AccentButton
              key={tierId}
              variant="primary"
              className={styles.bigButton}
              disabled={disabled}
              onClick={() => onPlace(tierId)}
              color={tier?.color}
            >
              {label}
            </AccentButton>
          );
        })}
      </div>
    </div>
  );
}
