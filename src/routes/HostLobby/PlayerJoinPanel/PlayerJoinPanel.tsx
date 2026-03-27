import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { RoomCodeDisplay } from "@/components/RoomCodeDisplay/RoomCodeDisplay";
import { PlayerSlotPlaceholder } from "@/components/PlayerSlotPlaceholder/PlayerSlotPlaceholder";
import { LOBBY_CAPACITY, type RoomPublicState } from "@twf/contracts";
import { roomSocket } from "@/services/sockets/roomSocket";
import styles from "./PlayerJoinPanel.module.scss";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";

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

            <div
              className={styles.qrPlaceholder}
              role="img"
              aria-label="QR code placeholder"
            >
              <div className={styles.qrPlaceholderContent}>
                <MainTextTypography
                  variant="body"
                  weight="bold"
                  textAlign="center"
                  letterSpacing="wide"
                >
                  QR Code
                </MainTextTypography>
                <MainTextTypography
                  variant="caption"
                  textAlign="center"
                  className={styles.qrPlaceholderCaption}
                >
                  Placeholder for future join flow
                </MainTextTypography>
              </div>
            </div>
          </section>

          <div className={styles.roomMetaSection}>
            <MainTextTypography variant="body" muted textAlign="center">
              or use the room code at: <br /> {joinLocationLabel}
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
  return (
    <li className={styles.playerCell}>
      <div className={styles.playerEntry}>
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
      </div>
    </li>
  );
}
