import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerLobby.module.scss";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { HowToPlayModal } from "@/components/HowToPlayModal/HowToPlayModal";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { roomSocket } from "@/services/sockets/roomSocket";
import { ROUTES } from "@/routes/routes";
import { getPlayerNameById } from "@/lib/players";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";
import { useAutoScroll } from "@/lib/hooks/useAutoScroll";
import { clearPlayerRoomState, readPlayerRuntime } from "@/lib/roomClientState";

type RoomPublicState = Contracts.RoomPublicState;

export default function PlayerLobby({ state }: { state: RoomPublicState }) {
  const navigate = useNavigate();
  useAutoScroll();

  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const identityNameRef = useRef<HTMLSpanElement | null>(null);

  const { playerId: myPlayerId } = readPlayerRuntime(state.code);
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
      clearPlayerRoomState(state.code);
      roomSocket.leaveRoom();
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
        <MainTextTypography
          variant="caption"
          muted
          letterSpacing="wide"
          className={styles.waitingStatus}
        >
          Waiting for host
          <AnimatedDots className={styles.waitingDots} />
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
