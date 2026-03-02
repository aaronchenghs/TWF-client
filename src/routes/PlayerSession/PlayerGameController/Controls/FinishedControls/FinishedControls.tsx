import { useEffect, useMemo, useState } from "react";
import styles from "./FinishedControls.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { CreatorMessageButton } from "@/components/CreatorMessageButton/CreatorMessageButton";
import { ShareResultsButton } from "@/components/ShareResultsButton/ShareResultsButton";
import { roomSocket } from "@/services/sockets/roomSocket";
import * as Contracts from "@twf/contracts";

type FinishedControlsProps = {
  state: Contracts.RoomPublicState;
};

export function FinishedControls({ state }: FinishedControlsProps) {
  const [isPlayAgainSubmitting, setIsPlayAgainSubmitting] = useState(false);
  const [isWaitingForHostRematch, setIsWaitingForHostRematch] = useState(false);
  const [hasHostStartedRematch, setHasHostStartedRematch] = useState(false);

  const playAgainLabel = useMemo(() => {
    if (hasHostStartedRematch)
      return isPlayAgainSubmitting ? "Joining..." : "Play Again";
    if (isWaitingForHostRematch) return "Waiting for host...";
    return isPlayAgainSubmitting ? "Sending..." : "Play Again";
  }, [hasHostStartedRematch, isWaitingForHostRematch, isPlayAgainSubmitting]);

  const finishedMessage = useMemo(() => {
    if (hasHostStartedRematch)
      return "Host started a new lobby. Join when ready.";
    if (isWaitingForHostRematch) return "Waiting for host to play again.";
    return "Ready for another round?";
  }, [hasHostStartedRematch, isWaitingForHostRematch]);

  const handlePlayAgain = () => {
    if (state.phase !== "FINISHED") return;
    if (isPlayAgainSubmitting || isWaitingForHostRematch) return;
    setIsPlayAgainSubmitting(true);
    roomSocket.playAgain();
  };

  useEffect(
    function subscribeToRematchSignalsWhileFinished() {
      if (state.phase !== "FINISHED") return;

      const offQueued = roomSocket.onPlayAgainQueued(() => {
        setIsPlayAgainSubmitting(false);
        setIsWaitingForHostRematch(true);
        setHasHostStartedRematch(false);
      });

      const offStarted = roomSocket.onPlayAgainStarted(() => {
        setIsPlayAgainSubmitting(false);
        setIsWaitingForHostRematch(false);
        setHasHostStartedRematch(true);
      });

      return () => {
        offQueued();
        offStarted();
      };
    },
    [state.phase],
  );

  useEffect(
    function resetRematchFlagsWhenLeavingFinished() {
      if (state.phase === "FINISHED") return;
      setIsWaitingForHostRematch(false);
      setHasHostStartedRematch(false);
      setIsPlayAgainSubmitting(false);
    },
    [state.phase],
  );

  return (
    <div className={styles.finishedStack}>
      <div className={styles.utilityActionsRow}>
        <ShareResultsButton state={state} />
        <CreatorMessageButton />
      </div>

      <div className={styles.finishedActions}>
        <MainTextTypography
          variant="body"
          muted
          textAlign="center"
          className={styles.finishedMessage}
        >
          {finishedMessage}
        </MainTextTypography>

        <AccentButton
          onClick={handlePlayAgain}
          disabled={isPlayAgainSubmitting || isWaitingForHostRematch}
        >
          {playAgainLabel}
        </AccentButton>
      </div>
    </div>
  );
}
