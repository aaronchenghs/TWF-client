import type { TierSetSummary } from "@twf/contracts";
import styles from "./TierSetGridEntry.module.scss";
import clsx from "clsx";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";

type TierSetGridEntryProps = {
  tierSet: TierSetSummary;
  selected: boolean;
  onSelect: (tierSet: TierSetSummary) => void;
};

export function TierSetGridEntry({
  tierSet,
  selected,
  onSelect,
}: TierSetGridEntryProps) {
  return (
    <button
      type="button"
      className={clsx(styles.presetCard, selected && styles.selected)}
      onClick={() => onSelect(tierSet)}
      aria-pressed={selected}
    >
      <div className={styles.presetCardContent}>
        <MainTextTypography variant="h4" className={styles.presetTitle}>
          {tierSet.title}
        </MainTextTypography>
        <MainTextTypography
          variant="body"
          muted
          className={styles.presetDescription}
        >
          {tierSet.description ?? "—"}
        </MainTextTypography>
      </div>

      <div className={styles.presetCardFooter}>
        <MainTextTypography
          variant="caption"
          muted={!selected}
          className={selected ? styles.selectedPill : styles.hintPill}
        >
          {selected ? "SELECTED" : "CLICK TO SELECT"}
        </MainTextTypography>
      </div>
    </button>
  );
}
