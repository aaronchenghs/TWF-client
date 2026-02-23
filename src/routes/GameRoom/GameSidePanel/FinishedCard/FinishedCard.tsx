import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
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
    <GameStatusCard label="NEXT ROUND">
      <div className={styles.rematchCard}>
        <MainTextTypography variant="body" muted textAlign="center">
          Return to lobby with the same players and a new tier set.
        </MainTextTypography>
        <AccentButton onClick={onPlayAgain} disabled={isRematchSubmitting}>
          {isRematchSubmitting ? "Starting..." : "Play Again"}
        </AccentButton>
      </div>
    </GameStatusCard>
  );
}
