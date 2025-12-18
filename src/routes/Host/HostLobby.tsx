import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import styles from "./HostLobby.module.scss";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { SubtextDivider } from "../../components/SubtextDivider/SubtextDivider";
import { useEffect, useState } from "react";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";

const SAMPLE_PRESETS = ["Movies", "Fast Food", "Video Games"];

export default function HostLobby() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [selectedPreset] = useState(false);

  const roomCode = code ?? null;
  const playerCount = 0;
  const isStartEnabled = selectedPreset && playerCount >= 2;

  useEffect(() => {
    if (!roomCode) return;

    socketClient.connect();
    roomSocket.joinRoom({ code: roomCode, role: "host" });

    return () => socketClient.disconnect();
  }, [roomCode]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <MainTextTypography variant="h1" className={styles.title}>
          Hosting Lobby
        </MainTextTypography>

        <div className={styles.roomMeta}>
          <MainTextTypography className={styles.roomLabel} variant="h4">
            Room Code:
          </MainTextTypography>
          <MainTextTypography className={styles.roomCode} variant="h2">
            {roomCode ?? "— — — —"}
          </MainTextTypography>
        </div>
      </header>

      <MainTextTypography variant="body" muted>
        Waiting for players to join…
      </MainTextTypography>

      <div className={styles.layout}>
        <section className={styles.left}>
          <SubtextDivider text="Choose a Tier List" />

          <div className={styles.presetGrid}>
            {SAMPLE_PRESETS.map((preset) => (
              <div key={preset} className={clsx(styles.presetCard)}>
                {preset}
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.panel}>
            <MainTextTypography variant="h3">
              Players ({playerCount})
            </MainTextTypography>

            <ul className={styles.playerList}>
              <MainTextTypography
                className={styles.player}
                variant="body"
                muted
              >
                Waiting…
              </MainTextTypography>
            </ul>
          </div>

          <div className={clsx(styles.panel, styles.controls)}>
            <AccentButton variant="secondary" onClick={() => navigate("/")}>
              Close
            </AccentButton>
            <AccentButton variant="primary" disabled={!isStartEnabled}>
              Start Game
            </AccentButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
