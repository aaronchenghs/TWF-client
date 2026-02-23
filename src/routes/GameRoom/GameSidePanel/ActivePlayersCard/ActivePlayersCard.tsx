import { useRef } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { getPlayersInTurnDisplayOrder } from "@/lib/players";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";
import styles from "./ActivePlayersCard.module.scss";

type RoomPublicState = Contracts.RoomPublicState;
type Player = RoomPublicState["players"][number];

type ActivePlayersCardProps = {
  state: RoomPublicState;
};

function ActivePlayerRow({
  player,
  isCurrentTurnPlayer,
}: {
  player: Player;
  isCurrentTurnPlayer: boolean;
}) {
  const playerNameRef = useRef<HTMLSpanElement | null>(null);

  useAutoFitText(playerNameRef, {
    minFontSizePx: 10,
    watch: `${player.name}:${isCurrentTurnPlayer ? "current" : "normal"}`,
  });

  return (
    <motion.div
      key={player.id}
      layout
      role="listitem"
      className={clsx(
        styles.activePlayerRow,
        isCurrentTurnPlayer && styles.activePlayerRowCurrent,
      )}
      initial={{ opacity: 0, x: "50%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "50%" }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <PlayerAvatar
        avatar={player.avatar}
        size={50}
        className={styles.activePlayerAvatar}
        sway
      />
      <MainTextTypography
        ref={playerNameRef}
        variant={isCurrentTurnPlayer ? "h2" : "h3"}
        tone={isCurrentTurnPlayer ? "player" : "default"}
        muted
        className={styles.activePlayerName}
      >
        {player.name}
      </MainTextTypography>
    </motion.div>
  );
}

export function ActivePlayersCard({ state }: ActivePlayersCardProps) {
  const currentTurnPlayerId = state.currentTurnPlayerId ?? null;
  const playersInDisplayOrder = getPlayersInTurnDisplayOrder(state);

  return (
    <GameStatusCard
      className={styles.playersCard}
      bodyClassName={styles.playersBody}
    >
      <div className={styles.activePlayersList} role="list">
        <AnimatePresence initial={false}>
          {playersInDisplayOrder.length > 0 ? (
            playersInDisplayOrder.map((player) => {
              const isCurrentTurnPlayer = player.id === currentTurnPlayerId;

              return (
                <ActivePlayerRow
                  key={player.id}
                  player={player}
                  isCurrentTurnPlayer={isCurrentTurnPlayer}
                />
              );
            })
          ) : (
            <MainTextTypography variant="body" muted>
              No active players
            </MainTextTypography>
          )}
        </AnimatePresence>
      </div>
    </GameStatusCard>
  );
}
