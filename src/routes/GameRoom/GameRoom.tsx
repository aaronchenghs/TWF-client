import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
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

export default function GameRoom() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);

  const [state, setState] = useState<RoomPublicState | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
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
  }, [roomCode, navigate]);

  const clock = usePhaseClock(state);

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
          <MainTextTypography variant="h2">
            Tiers With Friends
          </MainTextTypography>
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            ROOM {state.code}
          </MainTextTypography>
        </div>

        <div className={styles.headerRight}>
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            PLAYERS {state.players.length}
          </MainTextTypography>
          <AccentButton
            variant="secondary"
            onClick={() => {
              socketClient.disconnect();
              navigate(ROUTES.LANDING, { replace: true });
            }}
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
            <MainTextTypography variant="label" muted letterSpacing="wide">
              TURN
            </MainTextTypography>
            <MainTextTypography variant="body" muted>
              {renderTurnLabel(state)}
            </MainTextTypography>
          </div>

          <div className={styles.card}>
            <MainTextTypography variant="label" muted letterSpacing="wide">
              STATUS
            </MainTextTypography>
            <MainTextTypography
              variant="body"
              className={clsx(err && styles.errorText)}
              muted={!err}
            >
              {err ?? "Live"}
            </MainTextTypography>
          </div>
        </aside>
      </main>
    </div>
  );
}

function renderTurnLabel(state: RoomPublicState): string {
  const pid = state.currentTurnPlayerId;
  if (!pid) return "—";
  const p = state.players.find((x) => x.id === pid);
  return p ? `${p.name}'s turn` : "—";
}
