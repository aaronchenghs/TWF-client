import clsx from "clsx";
import { SubtextDivider } from "@/components/SubtextDivider/SubtextDivider";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { TierSetGridEntry } from "../TierSetGridEntry/TierSetGridEntry";
import type { TierSetSummary } from "@twf/contracts";
import type { Guid } from "@/lib/guid";
import { roomSocket } from "@/services/sockets/roomSocket";
import { useState } from "react";
import styles from "./TierSetSelection.module.scss";

type TierSetSelectionProps = {
  tierSets: TierSetSummary[];
  selectedTierSetId: Guid | null;
  isLoading: boolean;
  className?: string;
  hideHeading?: boolean;
};

export function TierSetSelection({
  tierSets,
  selectedTierSetId,
  isLoading,
  className,
}: TierSetSelectionProps) {
  const [tierSetWithDetailsOpen, setTierSetWithDetailsOpen] =
    useState<Guid | null>(null);
  const selectedTierSet = tierSets.find(
    (tierSet) => tierSet.id === selectedTierSetId,
  );
  const selectedTierSetTitle = selectedTierSet?.title ?? "Choose a Tier Set";

  const handleSelectTierSet = (ts: TierSetSummary) => {
    roomSocket.setTierSet(ts.id);
  };

  return (
    <section className={clsx(styles.root, className)}>
      <SubtextDivider
        text={selectedTierSetTitle}
        textTone={selectedTierSet ? "player" : "default"}
        noMargin
      />

      <div className={styles.presetGrid}>
        {isLoading || tierSets.length === 0 ? (
          <MainTextTypography variant="body" muted>
            Loading tier lists
            <AnimatedDots />
          </MainTextTypography>
        ) : (
          tierSets.map((set, index) => (
            <TierSetGridEntry
              key={set.id}
              index={index}
              tierSet={set}
              selected={set.id === selectedTierSetId}
              onSelect={handleSelectTierSet}
              setOpenDetailsTierSet={setTierSetWithDetailsOpen}
              openDetailsTierSetId={tierSetWithDetailsOpen}
            />
          ))
        )}
      </div>
    </section>
  );
}
