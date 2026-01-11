import { useMemo } from "react";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";

export function PlaceControls(props: {
  tiers: Array<{ id: string; name: string }>;
  tierOrder: string[];
  disabled: boolean;
  onPlace: (tierId: string) => void;
}) {
  const { tiers, tierOrder, disabled, onPlace } = props;

  const tiersById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tiers) m.set(t.id, t.name);
    return m;
  }, [tiers]);

  const ordered = tierOrder.length ? tierOrder : tiers.map((t) => t.id);

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
        {ordered.map((tierId) => (
          <AccentButton
            key={tierId}
            variant="primary"
            className={styles.bigButton}
            disabled={disabled}
            onClick={() => onPlace(tierId)}
          >
            {tiersById.get(tierId) ?? tierId}
          </AccentButton>
        ))}
      </div>
    </div>
  );
}
