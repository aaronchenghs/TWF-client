import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerLobby.module.scss";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { HowToPlayModal } from "@/components/HowToPlayModal/HowToPlayModal";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { socketClient } from "@/services/sockets/socketClient";
import { ROUTES } from "@/routes/routes";
import { getPlayerId } from "@/lib/session";
import { getPlayerNameById } from "@/lib/players";

type RoomPublicState = Contracts.RoomPublicState;

export default function PlayerLobby({ state }: { state: RoomPublicState }) {
  const navigate = useNavigate();

  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  const myPlayerId = getPlayerId(state.code);

  const myName = getPlayerNameById(state.players, myPlayerId);

  const handleConfirmQuit = () => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  };

  return (
    <div className={styles.waiting}>
      <TWFLogo className={styles.logo} aria-hidden="true" />

      <section className={styles.identity}>
        <MainTextTypography variant="body" muted>
          YOU ARE:
        </MainTextTypography>
        <MainTextTypography
          variant="h2"
          weight="medium"
          letterSpacing="wide"
          className={styles.identityName}
          tone="player"
        >
          {myName}
        </MainTextTypography>
      </section>

      <section className={styles.instructions}>
        <button
          type="button"
          className={styles.instructionsTrigger}
          onClick={() => setIsHowToOpen(true)}
        >
          <div className={styles.instructionsSummaryText}>
            <MainTextTypography variant="body" muted letterSpacing="wide">
              HOW TO PLAY
            </MainTextTypography>
            <MainTextTypography variant="body" weight="medium">
              Game Instructions
            </MainTextTypography>
          </div>

          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </section>

      <section className={styles.status}>
        <MainTextTypography
          variant="body"
          muted
          letterSpacing="wide"
          className={styles.statusLabel}
        >
          WAITING FOR HOST TO START
          <AnimatedDots className={styles.statusDots} />
        </MainTextTypography>
      </section>

      <div className={styles.actions}>
        <AccentButton
          variant="secondary"
          className={styles.leaveButton}
          onClick={() => setIsConfirmQuitOpen(true)}
        >
          QUIT
        </AccentButton>
      </div>

      <footer className={styles.footer}>
        <MainTextTypography variant="caption" muted letterSpacing="wide">
          KEEP THIS TAB OPEN
        </MainTextTypography>
      </footer>

      <ConfirmationModal
        open={isConfirmQuitOpen}
        title="Leave lobby?"
        message="This will disconnect you from the lobby."
        confirmText="Quit"
        destructive
        onCancel={() => setIsConfirmQuitOpen(false)}
        onConfirm={handleConfirmQuit}
      />

      <HowToPlayModal
        open={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
