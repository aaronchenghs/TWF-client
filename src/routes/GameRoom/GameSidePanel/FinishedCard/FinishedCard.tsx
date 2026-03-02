import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { FinishedUtilityActions } from "@/components/FinishedUtilityActions/FinishedUtilityActions";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";
import styles from "./FinishedCard.module.scss";

type RoomPublicState = Contracts.RoomPublicState;

type FinishedCardProps = {
  state: RoomPublicState;
  onPlayAgain: () => void;
  isRematchSubmitting: boolean;
};

export function FinishedCard({
  state,
  onPlayAgain,
  isRematchSubmitting,
}: FinishedCardProps) {
  if (state.phase !== "FINISHED") return null;

  return (
    <div className={styles.finishedStack}>
      <GameStatusCard>
        <div className={styles.rematchCard}>
          <MainTextTypography variant="body" muted textAlign="center">
            Return to lobby with the same players?
          </MainTextTypography>
          <AccentButton onClick={onPlayAgain} disabled={isRematchSubmitting}>
            {isRematchSubmitting ? "Starting..." : "Play Again"}
          </AccentButton>
        </div>
      </GameStatusCard>
      <FinishedUtilityActions state={state} />
    </div>
  );
}
