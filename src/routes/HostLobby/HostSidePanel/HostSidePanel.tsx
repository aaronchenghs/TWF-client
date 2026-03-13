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
import type { GameSettings } from "@/lib/gameSettings";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useMobileView } from "@/lib/hooks/useMobileView";
import styles from "./HostSidePanel.module.scss";
import { GameSettingsModal } from "../GameSettingsModal/GameSettingsModal";

type Player = Contracts.RoomPublicState["players"][number];

type HostSidePanelProps = {
  roomCode: string;
  players: Player[];
  gameSettings: GameSettings;
  selectedTierSetId: Guid | null;
  selectedTierSetName: string | null;
  onCountdownDisplayCountChange: (count: 3 | 2 | 1 | null) => void;
  suppressRejoinNoticeRef: React.MutableRefObject<boolean>;
};

export function HostSidePanel({
  roomCode,
  players,
  gameSettings,
  selectedTierSetId,
  selectedTierSetName,
  onCountdownDisplayCountChange,
  suppressRejoinNoticeRef,
}: HostSidePanelProps) {
  const [isGameSettingsOpen, setIsGameSettingsOpen] = useState(false);
  const [isStartCountdownOpen, setIsStartCountdownOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMobileView();
  const buttonIconProps = ICON_PROPS.quickActions;
  const { gameSettings: GameSettingsIcon, startGame: StartGameIcon } =
    APP_ICONS;
  const buttonLabelVariant = isMobile ? "h2" : "h3";

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
          variant="h1"
        />
      </div>

      <div className={clsx(styles.panel, styles.controls)}>
        <MainTextTypography
          variant={selectedTierSetName ? "h3" : "body"}
          tone="player"
          textAlign="center"
          muted={!selectedTierSetName}
          className={styles.selectedTierSetName}
        >
          {selectedTierSetName ?? "No tier set selected"}
        </MainTextTypography>

        <AccentButton
          variant="secondary"
          disabled={isStartCountdownOpen}
          onClick={() => setIsGameSettingsOpen(true)}
        >
          <MainTextTypography
            variant={buttonLabelVariant}
            className={styles.buttonContent}
          >
            <GameSettingsIcon {...buttonIconProps} aria-hidden="true" />
            Customize
          </MainTextTypography>
        </AccentButton>

        <AccentButton
          variant="primary"
          disabled={!isStartEnabled || isStartCountdownOpen}
          onClick={handleStartClick}
        >
          <MainTextTypography
            variant={buttonLabelVariant}
            className={styles.buttonContent}
          >
            <StartGameIcon {...buttonIconProps} aria-hidden="true" />
            Start Game
          </MainTextTypography>
        </AccentButton>
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
                    variant="h4"
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

      <CountdownOverlay
        open={isStartCountdownOpen}
        onCancel={handleCancelCountdown}
        onComplete={handleCountdownComplete}
        onDisplayCountChange={onCountdownDisplayCountChange}
      />

      <GameSettingsModal
        open={isGameSettingsOpen}
        settings={gameSettings}
        onClose={() => setIsGameSettingsOpen(false)}
        onChange={(nextSettings) => roomSocket.setGameSettings(nextSettings)}
      />
    </aside>
  );
}
