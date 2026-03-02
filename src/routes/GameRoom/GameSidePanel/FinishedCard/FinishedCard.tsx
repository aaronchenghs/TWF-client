import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { CreatorMessageButton } from "@/components/CreatorMessageButton/CreatorMessageButton";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";
import styles from "./FinishedCard.module.scss";

type Phase = Contracts.RoomPublicState["phase"];

type FinishedCardProps = {
  phase: Phase;
  onPlayAgain: () => void;
  isRematchSubmitting: boolean;
};

export function FinishedCard({
  phase,
  onPlayAgain,
  isRematchSubmitting,
}: FinishedCardProps) {
  if (phase !== "FINISHED") return null;

  return (
    <div className={styles.finishedStack}>
      <GameStatusCard label="NEXT ROUND">
        <div className={styles.rematchCard}>
          <MainTextTypography variant="body" muted textAlign="center">
            Return to lobby with the same players?
          </MainTextTypography>
          <AccentButton onClick={onPlayAgain} disabled={isRematchSubmitting}>
            {isRematchSubmitting ? "Starting..." : "Play Again"}
          </AccentButton>
        </div>
      </GameStatusCard>
      <div className={styles.creatorMessageRow}>
        <CreatorMessageButton />
      </div>
    </div>
  );
}
