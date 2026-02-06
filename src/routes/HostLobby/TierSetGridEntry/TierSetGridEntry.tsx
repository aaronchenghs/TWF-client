import styles from "./TierSetGridEntry.module.scss";
import clsx from "clsx";
import { useCallback, useId, useState } from "react";
import { MainTextTypography } from "../../../components/MainTextTypography/MainTextTypography";
import { roomSocket } from "../../../services/sockets/roomSocket";
import { TierSetDetails } from "./TierSetDetails/TierSetDetails";
import * as Contracts from "@twf/contracts";
import type { Guid } from "../../../lib/guid";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { handleKeyDown } from "@/lib/accessibility";
import { Pill } from "@/components/Pill/Pill";

type TierSetSummary = Contracts.TierSetSummary;
type TierSetDefinition = Contracts.TierSetDefinition;

type TierSetGridEntryProps = {
  tierSet: TierSetSummary;
  selected: boolean;
  openDetailsTierSetId: Guid | null;
  setOpenDetailsTierSet: React.Dispatch<React.SetStateAction<Guid | null>>;
  onSelect: (tierSet: TierSetSummary) => void;
};

export function TierSetGridEntry({
  tierSet,
  selected,
  openDetailsTierSetId,
  setOpenDetailsTierSet,
  onSelect,
}: TierSetGridEntryProps) {
  const [details, setDetails] = useState<TierSetDefinition | null>(null);
  const isDetailsOpen = openDetailsTierSetId === tierSet.id;
  const detailsRegionId = useId();

  const toggleDetails = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (isDetailsOpen) {
        setOpenDetailsTierSet(null);
        return;
      }

      setOpenDetailsTierSet(tierSet.id as Guid);

      if (!details) {
        const fullDetails = await roomSocket.getTierSet(tierSet.id);
        setDetails(fullDetails);
      }
    },
    [details, isDetailsOpen, setOpenDetailsTierSet, tierSet.id],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(styles.presetCard, selected && styles.presetCardSelected)}
      onClick={() => onSelect(tierSet)}
      onKeyDown={(e) =>
        handleKeyDown(e, () => {
          onSelect(tierSet);
        })
      }
      aria-pressed={selected}
    >
      <div className={styles.headerRow}>
        <MainTextTypography variant="h4" className={styles.presetTitle}>
          {tierSet.title}
        </MainTextTypography>

        <AccentButton
          type="button"
          size="small"
          onClick={toggleDetails}
          aria-expanded={isDetailsOpen}
          aria-controls={detailsRegionId}
        >
          {isDetailsOpen ? "HIDE DETAILS" : "DETAILS"}
        </AccentButton>
      </div>

      <div className={styles.content}>
        <div
          id={detailsRegionId}
          className={clsx(styles.collapse, isDetailsOpen && styles.open)}
        >
          <TierSetDetails isLoading={!details} details={details} />
        </div>

        <div className={clsx(styles.collapse, !isDetailsOpen && styles.open)}>
          <MainTextTypography
            variant="body"
            muted
            className={styles.presetDescription}
          >
            {tierSet.description ?? "—"}
          </MainTextTypography>
        </div>
      </div>

      <div className={styles.footerRow}>
        {selected ? (
          <Pill size="md" shape="soft" className={styles.selectedPill}>
            <MainTextTypography variant="caption">SELECTED</MainTextTypography>
          </Pill>
        ) : (
          <button
            type="button"
            className={styles.selectButton}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(tierSet);
            }}
          >
            <MainTextTypography variant="caption" muted>
              SELECT
            </MainTextTypography>
          </button>
        )}
      </div>
    </div>
  );
}
