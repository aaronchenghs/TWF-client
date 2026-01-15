import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";
import { normalizeCode } from "../../lib/codeUtils";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerLobby.module.scss";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { ConfirmationModal } from "../../components/ConfirmationModal/ConfirmationModal";
import { ROUTES } from "../routes";
import { HowToPlayModal } from "../../components/HowToPlayModal/HowToPlayModal";
import * as Contracts from "@twf/contracts";

const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function PlayerLobby() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [howToKey, setHowToKey] = useState(0);

  const roomCode = normalizeCode(code ?? "");
  const name = (searchParams.get("name") ?? "").trim();

  const openHowTo = () => {
    setHowToKey((k) => k + 1);
    setIsHowToOpen(true);
  };

  const handleConfirmQuit = () => {
    socketClient.disconnect();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!roomCode || roomCode.length !== CODE_LENGTH || !name) return;
    socketClient.connect();
    roomSocket.joinRoom({ code: roomCode, role: "player", name });

    const offClosed = roomSocket.onRoomClosed(() => {
      socketClient.disconnect();
      navigate(ROUTES.LANDING, { replace: true });
    });

    const offState = roomSocket.onRoomState((state) => {
      if (state.phase !== "LOBBY") {
        const queryString = new URLSearchParams({ name }).toString();
        navigate(
          `${ROUTES.PLAYER_GAME_CONTROLLER}/${roomCode}?${queryString}`,
          {
            replace: true,
          }
        );
      }
    });

    return () => {
      offClosed();
      offState();
    };
  }, [roomCode, name, navigate]);

  return (
    <div className={styles.waiting}>
      <TWFLogo className={styles.logo} />

      <section className={styles.identity}>
        <MainTextTypography variant="body" muted>
          YOU ARE:
        </MainTextTypography>
        <MainTextTypography variant="title" weight="medium">
          {name}
        </MainTextTypography>
      </section>

      <section className={styles.instructions}>
        <button
          type="button"
          className={styles.instructionsTrigger}
          onClick={openHowTo}
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
        <MainTextTypography variant="body" muted letterSpacing="wide">
          WAITING FOR HOST TO START
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
        confirmText="Quit"
        destructive
        onCancel={() => setIsConfirmQuitOpen(false)}
        onConfirm={handleConfirmQuit}
      />

      <HowToPlayModal
        key={howToKey}
        open={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
