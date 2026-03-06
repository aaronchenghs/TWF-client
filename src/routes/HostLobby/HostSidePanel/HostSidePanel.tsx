import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { RoomCodeDisplay } from "@/components/RoomCodeDisplay/RoomCodeDisplay";
import * as Contracts from "@twf/contracts";
import { useState, useCallback } from "react";
import { CountdownOverlay } from "../CountdownOverlay/CountdownOverlay";
import { markHostRoomStarted } from "@/lib/roomClientState";
import { roomSocket } from "@/services/sockets/roomSocket";
import { ROUTES } from "@/routes/routes";
import { useNavigate } from "react-router-dom";
import type { Guid } from "@/lib/guid";
import styles from "./HostSidePanel.module.scss";

type Player = Contracts.RoomPublicState["players"][number];

type HostSidePanelProps = {
  roomCode: string;
  players: Player[];
  selectedTierSetId: Guid | null;
  selectedTierSetName: string | null;
  onCloseLobby: () => void;
  onCountdownDisplayCountChange: (count: 3 | 2 | 1 | null) => void;
  suppressRejoinNoticeRef: React.MutableRefObject<boolean>;
};

export function HostSidePanel({
  roomCode,
  players,
  selectedTierSetId,
  selectedTierSetName,
  onCloseLobby,
  onCountdownDisplayCountChange,
  suppressRejoinNoticeRef,
}: HostSidePanelProps) {
  const [isStartCountdownOpen, setIsStartCountdownOpen] = useState(false);
  const navigate = useNavigate();

  const isStartEnabled = !!selectedTierSetId && players.length >= 2;

  const handleStartClick = useCallback(() => {
    if (!isStartEnabled) return;
    setIsStartCountdownOpen(true);
  }, [isStartEnabled]);

  const handleCancelCountdown = useCallback(() => {
    setIsStartCountdownOpen(false);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    markHostRoomStarted(roomCode);
    roomSocket.startGame(roomCode);
    navigate(ROUTES.GAME_ROOM);
  }, [navigate, roomCode, suppressRejoinNoticeRef]);

  return (
    <aside className={styles.sidePanel}>
      <div className={styles.roomMeta}>
        <MainTextTypography className={styles.roomLabel} muted variant="h4">
          Room Code:
        </MainTextTypography>
        <RoomCodeDisplay
          roomCode={roomCode}
          className={styles.roomCodeContainer}
          codeClassName={styles.roomCode}
          variant="h2"
        />
      </div>

      <div className={styles.panel}>
        <MainTextTypography variant="h3">
          Players ({players.length}/{Contracts.LOBBY_CAPACITY})
        </MainTextTypography>

        <ul className={styles.playerList}>
          {players.length === 0 ? (
            <MainTextTypography className={styles.player} variant="body" muted>
              Waiting
              <AnimatedDots />
            </MainTextTypography>
          ) : (
            players.map((player) => (
              <li className={styles.playerEntry} key={player.id}>
                <div className={styles.playerIdentity}>
                  <PlayerAvatar avatar={player.avatar} size={45} sway />
                  <MainTextTypography
                    className={styles.player}
                    variant="h5"
                    tone="player"
                  >
                    {player.name}
                  </MainTextTypography>
                </div>
                <AccentButton
                  variant="destructive"
                  size="small"
                  onClick={() => roomSocket.bootPlayerFromLobby(player.id)}
                >
                  Kick
                </AccentButton>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className={clsx(styles.panel, styles.controls)}>
        <div
          className={clsx(
            styles.selectedTierSetCard,
            !selectedTierSetName && styles.selectedTierSetCardEmpty,
          )}
        >
          <div className={styles.selectedTierSetHeader}>
            <MainTextTypography
              variant="caption"
              letterSpacing="wide"
              className={styles.selectedTierSetLabel}
            >
              Selected Tier Set
            </MainTextTypography>
          </div>

          <MainTextTypography
            variant={selectedTierSetName ? "h4" : "body"}
            textAlign="center"
            muted={!selectedTierSetName}
            className={styles.selectedTierSetName}
          >
            {selectedTierSetName ?? "No tier set selected"}
          </MainTextTypography>
        </div>

        <AccentButton
          variant="primary"
          disabled={!isStartEnabled || isStartCountdownOpen}
          onClick={handleStartClick}
        >
          Start Game
        </AccentButton>

        <AccentButton
          variant="secondary"
          onClick={onCloseLobby}
          disabled={isStartCountdownOpen}
        >
          Close Lobby
        </AccentButton>
      </div>

      <CountdownOverlay
        open={isStartCountdownOpen}
        onCancel={handleCancelCountdown}
        onComplete={handleCountdownComplete}
        onDisplayCountChange={onCountdownDisplayCountChange}
      />
    </aside>
  );
}
