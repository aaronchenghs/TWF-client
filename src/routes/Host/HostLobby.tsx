import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import styles from "./HostLobby.module.scss";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { SubtextDivider } from "../../components/SubtextDivider/SubtextDivider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";
import { CODE_LENGTH, type RoomPublicState } from "@twf/contracts";
import { normalizeCode } from "../../lib/codeUtils";

const SAMPLE_PRESETS = ["Movies", "Fast Food", "Video Games"];

export default function HostLobby() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [selectedPreset] = useState(false);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const players = roomState?.players ?? [];
  const playerCount = players.length;
  const isStartEnabled = selectedPreset && playerCount >= 2;

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);

  const handleClose = useCallback(() => {
    socketClient.disconnect();
    navigate("/");
  }, [navigate]);

  useEffect(
    function bootStrapLobbySocket() {
      if (roomCode.length !== CODE_LENGTH) return;

      socketClient.connect();

      const offState = roomSocket.onRoomState((state) => {
        setRoomState(state);
        setErrorMessage(null);
      });

      const offError = roomSocket.onRoomError((msg) => {
        setErrorMessage(msg);
      });

      roomSocket.joinRoom({ code: roomCode, role: "host" });

      return () => {
        offState();
        offError();
      };
    },
    [roomCode]
  );

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
            {roomCode || "— — — —"}
          </MainTextTypography>
        </div>
      </header>

      <MainTextTypography variant="body" muted={!errorMessage}>
        {errorMessage ?? "Waiting for players to join…"}
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
              {players.length === 0 ? (
                <MainTextTypography
                  className={styles.player}
                  variant="body"
                  muted
                >
                  Waiting…
                </MainTextTypography>
              ) : (
                players.map((player) => (
                  <li key={player.id}>
                    <MainTextTypography
                      className={styles.player}
                      variant="body"
                    >
                      {player.name}
                    </MainTextTypography>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className={clsx(styles.panel, styles.controls)}>
            <AccentButton variant="secondary" onClick={handleClose}>
              Close Lobby
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
