import { SubtextDivider } from "@/components/SubtextDivider/SubtextDivider";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { TierSetGridEntry } from "../TierSetGridEntry/TierSetGridEntry";
import * as Contracts from "@twf/contracts";
import type { Guid } from "@/lib/guid";
import { roomSocket } from "@/services/sockets/roomSocket";
import { useState } from "react";
import styles from "./TierSetSelection.module.scss";

type TierSetSummary = Contracts.TierSetSummary;
type TierSetSelectionProps = {
  tierSets: TierSetSummary[];
  selectedTierSetId: Guid | null;
  isLoading: boolean;
};

export function TierSetSelection({
  tierSets,
  selectedTierSetId,
  isLoading,
}: TierSetSelectionProps) {
  const [tierSetWithDetailsOpen, setTierSetWithDetailsOpen] =
    useState<Guid | null>(null);

  const handleSelectTierSet = (ts: TierSetSummary) => {
    roomSocket.setTierSet(ts.id);
  };

  return (
    <section className={styles.left}>
      <SubtextDivider text="Choose a Tier List" noMargin />

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
