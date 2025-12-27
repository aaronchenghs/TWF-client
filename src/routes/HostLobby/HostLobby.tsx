import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import styles from "./HostLobby.module.scss";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { SubtextDivider } from "../../components/SubtextDivider/SubtextDivider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";
import {
  CODE_LENGTH,
  type RoomPublicState,
  type TierSetSummary,
} from "@twf/contracts";
import { normalizeCode } from "../../lib/codeUtils";
import { TierSetGridEntry } from "./TierSetGridEntry/TierSetGridEntry";
import { ConfirmationModal } from "../../components/ConfirmationModal/ConfirmationModal";
import { CopyTextButton } from "../../components/CopyTextButton/CopyTextButton";

export default function HostLobby() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [tierSets, setTierSets] = useState<TierSetSummary[]>([]);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const players = roomState?.players ?? [];
  const playerCount = players.length;
  const selectedTierSetId = roomState?.tierSetId ?? null;
  const isStartEnabled = !!selectedTierSetId && playerCount >= 2;
  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);

  const selectedTierSetName = useMemo(() => {
    if (!selectedTierSetId) return null;
    return (
      tierSets.find((tier) => tier.id === selectedTierSetId)?.title ?? null
    );
  }, [tierSets, selectedTierSetId]);

  const handleCloseLobby = useCallback(() => {
    roomSocket.closeRoom();
    navigate("/");
  }, [navigate]);

  const handleSelectTierSet = useCallback((ts: TierSetSummary) => {
    setErrorMessage(null);
    roomSocket.setTierSet(ts.id);
  }, []);

  useEffect(
    function bootStrapLobbySocket() {
      if (roomCode.length !== CODE_LENGTH) return;
      socketClient.connect();
      roomSocket.joinRoom({ code: roomCode, role: "host" });
      roomSocket.listTierSets().then(setTierSets);

      const offState = roomSocket.onRoomState((state) => {
        setRoomState(state);
        setErrorMessage(null);
      });

      const offError = roomSocket.onRoomError((msg) => {
        setErrorMessage(msg);
      });

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
          <div className={styles.roomCodeContainer}>
            <CopyTextButton
              value={roomCode}
              disabled={roomCode.length !== CODE_LENGTH}
              title="Copy room code"
            />
            <MainTextTypography className={styles.roomCode} variant="h2">
              {roomCode || "— — — —"}
            </MainTextTypography>
          </div>
        </div>
      </header>

      <MainTextTypography variant="body" muted={!errorMessage}>
        {errorMessage ?? "Waiting for players to join…"}
      </MainTextTypography>

      <div className={styles.layout}>
        <section className={styles.left}>
          <SubtextDivider text="Choose a Tier List" />

          <div className={styles.presetGrid}>
            {tierSets.length === 0 ? (
              <MainTextTypography variant="body" muted>
                Loading tier lists…
              </MainTextTypography>
            ) : (
              tierSets.map((set) => (
                <TierSetGridEntry
                  key={set.id}
                  tierSet={set}
                  selected={set.id === selectedTierSetId}
                  onSelect={handleSelectTierSet}
                />
              ))
            )}
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
                    <MainTextTypography className={styles.player} variant="h6">
                      {player.name}
                    </MainTextTypography>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className={clsx(styles.panel, styles.controls)}>
            <MainTextTypography
              variant="body"
              muted={!selectedTierSetName}
              className={styles.selectedTierSetLabel}
            >
              {selectedTierSetName
                ? `${selectedTierSetName}`
                : "No tier list selected"}
            </MainTextTypography>
            <AccentButton variant="primary" disabled={!isStartEnabled}>
              Start Game
            </AccentButton>
            <AccentButton
              variant="secondary"
              onClick={() => setIsConfirmCloseOpen(true)}
            >
              Close Lobby
            </AccentButton>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={isConfirmCloseOpen}
        title="Close Lobby?"
        message="This ends the session for everyone currently connected."
        confirmText="Close"
        destructive
        onCancel={() => setIsConfirmCloseOpen(false)}
        onConfirm={handleCloseLobby}
      />
    </div>
  );
}
