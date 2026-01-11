import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./GameRoom.module.scss";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { socketClient } from "../../services/sockets/socketClient";
import { roomSocket } from "../../services/sockets/roomSocket";
import { normalizeCode } from "../../lib/codeUtils";
import { ROUTES } from "../routes";
import type { RoomPublicState } from "@twf/contracts";
import { usePhaseClock } from "../../lib/hooks/usePhaseClock";
import { PhaseBanner } from "./PhaseBanner/PhaseBanner";
import { TierBoard } from "./TierBoard/TierBoard";
import { getTurnLabel } from "../../lib/phaseLabels";
import { ConfirmationModal } from "../../components/ConfirmationModal/ConfirmationModal";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";

export default function GameRoom() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [state, setState] = useState<RoomPublicState | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const clock = usePhaseClock(state);

  const isDevMode = import.meta.env.VITE_ENABLE_DEBUG_CONTROLS === "true";
  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);

  const handleExit = useCallback(() => {
    roomSocket.closeRoom();
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  useEffect(
    function handleRoomConnection() {
      if (!roomCode) return;

      socketClient.connect();
      roomSocket.joinRoom({ code: roomCode, role: "host" });

      const offState = roomSocket.onRoomState((s) => {
        setState(s);
        setErr(null);
      });

      const offError = roomSocket.onRoomError((msg) => setErr(msg));

      const offClosed = roomSocket.onRoomClosed(() => {
        socketClient.disconnect();
        navigate(ROUTES.LANDING, { replace: true });
      });

      return () => {
        offState();
        offError();
        offClosed();
      };
    },
    [roomCode, navigate]
  );

  useEffect(function logErrors() {
    return roomSocket.onRoomError((err) => {
      console.error("room:error", err);
    });
  }, []);

  if (!state) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <MainTextTypography variant="h2">Game</MainTextTypography>
          <MainTextTypography variant="h5" muted>
            ROOM {roomCode || "—"}
          </MainTextTypography>
        </header>

        <div className={styles.center}>
          <MainTextTypography variant="body" muted>
            Connecting…
          </MainTextTypography>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <TWFLogo className={styles.logo} />
        </div>

        <div className={styles.headerRight}>
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            ROOM {state.code}
          </MainTextTypography>
          <AccentButton
            variant="secondary"
            onClick={() => setIsConfirmExitOpen(true)}
          >
            Exit
          </AccentButton>
        </div>
      </header>

      <div className={styles.topRow}>
        <PhaseBanner state={state} clock={clock} error={err} />
      </div>

      <main className={styles.main}>
        <section className={styles.boardSection}>
          <TierBoard state={state} />
        </section>

        <aside className={styles.sideSection}>
          <div className={styles.card}>
            <MainTextTypography variant="label" muted letterSpacing="wide">
              CURRENT ITEM
            </MainTextTypography>
            <MainTextTypography variant="h3" className={styles.bigText}>
              {state.currentItem ?? "—"}
            </MainTextTypography>
          </div>

          <div className={styles.card}>
            <MainTextTypography variant="h3" muted>
              {getTurnLabel(state)}
            </MainTextTypography>
          </div>
        </aside>
      </main>

      <ConfirmationModal
        open={isConfirmExitOpen}
        title="Close Game?"
        message="This will boot all players from the game."
        confirmText="Exit"
        destructive
        onCancel={() => setIsConfirmExitOpen(false)}
        onConfirm={() => {
          setIsConfirmExitOpen(false);
          handleExit();
        }}
      />

      {isDevMode && (
        <div className={styles.devControls}>
          <span>👨‍💻 DEV CONTROLS:</span>
          <button onClick={roomSocket.debugTogglePause}>
            {state.debug?.paused ? "⏯ Resume" : "⏸Pause"}
          </button>
          <div className={styles.prevnextButtonsGroup}>
            <button onClick={() => roomSocket.debugPrev()}>⏮ Prev</button>
            <button onClick={() => roomSocket.debugNext()}>Next ⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}
