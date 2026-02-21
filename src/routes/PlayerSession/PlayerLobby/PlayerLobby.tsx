import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerLobby.module.scss";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { HowToPlayModal } from "@/components/HowToPlayModal/HowToPlayModal";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { socketClient } from "@/services/sockets/socketClient";
import { ROUTES } from "@/routes/routes";
import { getPlayerId } from "@/lib/session";
import { getPlayerNameById } from "@/lib/players";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";
import { useAutoScroll } from "@/lib/hooks/useAutoScroll";

type RoomPublicState = Contracts.RoomPublicState;

export default function PlayerLobby({ state }: { state: RoomPublicState }) {
  const navigate = useNavigate();
  useAutoScroll();

  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const identityNameRef = useRef<HTMLSpanElement | null>(null);

  const myPlayerId = getPlayerId(state.code);
  const myPlayer = myPlayerId
    ? (state.players.find((player) => player.id === myPlayerId) ?? null)
    : null;

  const myName = myPlayer?.name ?? getPlayerNameById(state.players, myPlayerId);

  useAutoFitText(identityNameRef, {
    minFontSizePx: 20,
    watch: myName,
  });

  const handleConfirmQuit = () => {
    setIsConfirmQuitOpen(false);
    window.requestAnimationFrame(() => {
      socketClient.disconnect();
      navigate(ROUTES.LANDING, { replace: true });
    });
  };

  return (
    <div className={styles.waiting}>
      <TWFLogo className={styles.logo} aria-hidden="true" />

      <section className={styles.identity}>
        <MainTextTypography variant="body" muted>
          YOU ARE:
        </MainTextTypography>
        <div className={styles.identityRow}>
          <PlayerAvatar avatar={myPlayer?.avatar} sway size={52} />
          <MainTextTypography
            variant="h2"
            weight="medium"
            letterSpacing="wide"
            className={styles.identityName}
            ref={identityNameRef}
            tone="player"
          >
            {myName}
          </MainTextTypography>
        </div>
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
        </button>
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
