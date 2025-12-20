import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";
import { normalizeCode } from "../../lib/codeUtils";
import { CODE_LENGTH } from "@twf/contracts";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import styles from "./PlayerLobby.module.scss";

export default function PlayerLobby() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const roomCode = normalizeCode(code ?? "");
  const name = (searchParams.get("name") ?? "").trim();

  useEffect(
    function connectToRoom() {
      if (!roomCode || roomCode.length !== CODE_LENGTH) return;
      if (!name) return;
      socketClient.connect();
      roomSocket.joinRoom({ code: roomCode, role: "player", name });
      return () => socketClient.disconnect();
    },
    [roomCode, name]
  );

  return (
    <div className={styles.waiting}>
      <header className={styles.header}>
        <MainTextTypography variant="label" muted>
          ROOM
        </MainTextTypography>

        <MainTextTypography
          variant="display"
          weight="bold"
          letterSpacing="wide"
        >
          {roomCode}
        </MainTextTypography>
      </header>

      <section className={styles.identity}>
        <MainTextTypography variant="label" muted>
          YOU ARE
        </MainTextTypography>

        <MainTextTypography variant="title" weight="medium">
          {name}
        </MainTextTypography>
      </section>

      <section className={styles.status}>
        <MainTextTypography variant="body" muted letterSpacing="wide">
          WAITING FOR HOST TO START
        </MainTextTypography>
      </section>

      <footer className={styles.footer}>
        <MainTextTypography variant="caption" muted letterSpacing="wide">
          KEEP THIS TAB OPEN
        </MainTextTypography>
      </footer>
    </div>
  );
}
