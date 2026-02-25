import clsx from "clsx";
import styles from "./PlayerTopBar.module.scss";
import { Pill } from "@/components/Pill/Pill";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useMemo } from "react";
import * as Contracts from "@twf/contracts";

type RoomPlayer = Contracts.RoomPublicState["players"][number];

type PlayerTopBarProps = {
  phase: Contracts.RoomPublicState["phase"];
  isMyTurn: boolean;
  hasConfirmedVote: boolean;
  player: RoomPlayer | null;
  onExit: () => void;
};

export function PlayerTopBar({
  phase,
  isMyTurn,
  hasConfirmedVote,
  player,
  onExit,
}: PlayerTopBarProps) {
  const statusLabel = useMemo(() => {
    switch (phase) {
      case "PLACE":
        return isMyTurn ? "Your Turn" : "Waiting";
      case "VOTE":
        return !isMyTurn && !hasConfirmedVote ? "Vote" : "Waiting";
      case "RESULTS":
        return "Results!";
      case "FINISHED":
        return "Finished";
      default:
        return "Waiting";
    }
  }, [phase, isMyTurn, hasConfirmedVote]);

  return (
    <div className={styles.topBar}>
      <div className={styles.identity}>
        <PlayerAvatar
          sway
          avatar={player?.avatar}
          size={34}
          className={styles.identityAvatar}
        />
      </div>

      <div className={styles.statusBar}>
        <Pill
          size="lg"
          className={clsx(
            styles.statusPill,
            statusLabel === "Your Turn" && styles.statusPlace,
            statusLabel === "Vote" && styles.statusVote,
            statusLabel === "Waiting" && styles.statusWait,
          )}
        >
          <MainTextTypography variant="label" className={styles.statusText}>
            {statusLabel}
            {statusLabel === "Waiting" && (
              <AnimatedDots className={styles.statusDots} />
            )}
          </MainTextTypography>
        </Pill>
      </div>

      <AccentButton
        variant="secondary"
        size="small"
        className={styles.exitButton}
        onClick={onExit}
      >
        Exit
      </AccentButton>
    </div>
  );
}
