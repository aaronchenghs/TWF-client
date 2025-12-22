import type { TierSetDefinition, TierSetSummary } from "@twf/contracts";
import styles from "./TierSetGridEntry.module.scss";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import { roomSocket } from "../../../services/sockets/roomSocket";
import { TierSetDetails } from "./TierSetDetails/TierSetDetails";

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<TierSetDefinition | null>(null);

  const toggleDetails = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const next = !isDetailsOpen;
      setIsDetailsOpen(next);
      if (!next || !!details) return;
      setDetailsError(null);

      try {
        const full = await roomSocket.getTierSet(tierSet.id);
        setDetails(full);
      } catch (error) {
        setDetailsError(
          error instanceof Error ? error.message : "Failed to load tier set."
        );
      }
    },
    [isDetailsOpen, details, tierSet.id]
  );

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

        {!isDetailsOpen ? (
          <MainTextTypography
            variant="body"
            muted
            className={styles.presetDescription}
          >
            {tierSet.description ?? "—"}
          </MainTextTypography>
        ) : (
          <TierSetDetails
            isLoading={!details && !detailsError}
            errorMessage={detailsError}
            details={details}
          />
        )}
      </div>

      <div className={styles.presetCardFooter}>
        <MainTextTypography
          variant="caption"
          muted={!selected}
          className={selected ? styles.selectedPill : styles.hintPill}
        >
          {selected ? "SELECTED" : null}
        </MainTextTypography>

        <button
          type="button"
          className={styles.detailsButton}
          onClick={toggleDetails}
          aria-expanded={isDetailsOpen}
        >
          {isDetailsOpen ? "HIDE DETAILS" : "DETAILS"}
        </button>
      </div>
    </button>
  );
}
