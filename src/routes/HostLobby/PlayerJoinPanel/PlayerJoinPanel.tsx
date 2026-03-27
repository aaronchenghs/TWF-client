import clsx from "clsx";
import { useMemo } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { RoomCodeDisplay } from "@/components/RoomCodeDisplay/RoomCodeDisplay";
import { PlayerSlotPlaceholder } from "@/components/PlayerSlotPlaceholder/PlayerSlotPlaceholder";
import { LOBBY_CAPACITY, type RoomPublicState } from "@twf/contracts";
import { roomSocket } from "@/services/sockets/roomSocket";
import styles from "./PlayerJoinPanel.module.scss";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { ROUTES } from "@/routes/routes";
import {
  PENDING_PLAYER_NAME_LABEL,
  hasSubmittedPlayerName,
} from "@/lib/players";
import { QrCodeDisplay } from "@/assets/components/QrCodeDisplay/QrCodeDisplay";

type Player = RoomPublicState["players"][number];

type PlayerJoinPanelProps = {
  className?: string;
  roomCode: string;
  players: Player[];
  joinLocationLabel: string;
};

export function PlayerJoinPanel({
  className,
  roomCode,
  players,
  joinLocationLabel,
}: PlayerJoinPanelProps) {
  const openSlotCount = Math.max(0, LOBBY_CAPACITY - players.length);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(ROUTES.PLAYER_SESSION, window.location.origin);
    url.searchParams.set("code", roomCode);
    return url.toString();
  }, [roomCode]);

  return (
    <aside className={clsx(styles.sidePanel, className)}>
      <div className={styles.panelHeader}>
        <MainTextTypography variant="h1" textAlign="center">
          Player Join
        </MainTextTypography>
      </div>

      <div className={styles.joinLayout}>
        <div className={styles.joinTopRow}>
          <section className={styles.joinSection} aria-label="Scan to Join">
            <MainTextTypography variant="h4" textAlign="center" tone="player">
              Scan to Join
            </MainTextTypography>

            <QrCodeDisplay
              value={joinUrl}
              loadingCaption={
                <>Players can still enter room code {roomCode} manually.</>
              }
            />
          </section>

          <div className={styles.joinDivider} aria-hidden="true">
            <MainTextTypography variant="h3" muted>
              or
            </MainTextTypography>
          </div>

          <div className={styles.roomMetaSection}>
            <MainTextTypography variant="body" muted textAlign="center">
              Enter this room code at:
              <br />
              {joinLocationLabel}
            </MainTextTypography>
            <section className={styles.roomMeta} aria-label="Room Code">
              <MainTextTypography
                variant="h4"
                letterSpacing="wide"
                className={styles.roomMetaLabel}
              >
                Room Code:
              </MainTextTypography>
              <RoomCodeDisplay
                roomCode={roomCode}
                className={styles.roomCodeContainer}
                codeClassName={styles.roomCode}
                copyButtonClassName={styles.roomCodeCopyButton}
                variant="h1"
              />
            </section>
          </div>
        </div>

        <section className={styles.playersSection}>
          <MainTextTypography variant="h3">
            Players ({players.length}/{LOBBY_CAPACITY}) <AnimatedDots />
          </MainTextTypography>

          <ul className={styles.playerList}>
            {players.map((player) => (
              <PlayerEntry key={player.id} player={player} />
            ))}

            {Array.from({ length: openSlotCount }, (_, index) => (
              <li className={styles.playerCell} key={`open-slot-${index + 1}`}>
                <PlayerSlotPlaceholder />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

type PlayerEntryProps = {
  player: Player;
};

function PlayerEntry({ player }: PlayerEntryProps) {
  const hasName = hasSubmittedPlayerName(player.name);

  return (
    <li className={styles.playerCell}>
      <div
        className={clsx(
          styles.playerEntry,
          !hasName && styles.playerEntryPending,
        )}
      >
        <div className={styles.playerIdentity}>
          <PlayerAvatar avatar={player.avatar} size={45} sway />
          <MainTextTypography
            className={clsx(styles.player, !hasName && styles.playerPending)}
            variant={hasName ? "h4" : "body"}
            tone={hasName ? "player" : undefined}
            muted={!hasName}
          >
            {hasName ? player.name : PENDING_PLAYER_NAME_LABEL}
            {!hasName ? <AnimatedDots /> : null}
          </MainTextTypography>
        </div>
        <AccentButton
          variant="destructive"
          size="small"
          onClick={() => roomSocket.bootPlayerFromLobby(player.id)}
        >
          Kick
        </AccentButton>
      </div>
    </li>
  );
}
