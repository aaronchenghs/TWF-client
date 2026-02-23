import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";
import styles from "./ActivePlayersCard.module.scss";

type RoomPublicState = Contracts.RoomPublicState;

type ActivePlayersCardProps = {
  state: RoomPublicState;
};

export function ActivePlayersCard({ state }: ActivePlayersCardProps) {
  const currentTurnPlayerId = state.currentTurnPlayerId ?? null;

  return (
    <GameStatusCard
      className={styles.playersCard}
      bodyClassName={styles.playersBody}
    >
      <div className={styles.activePlayersList} role="list">
        <AnimatePresence initial={false}>
          {state.players.length > 0 ? (
            state.players.map((player) => {
              const isCurrentTurnPlayer = player.id === currentTurnPlayerId;

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
                    size={40}
                    className={styles.activePlayerAvatar}
                    sway
                  />
                  <MainTextTypography
                    variant={isCurrentTurnPlayer ? "h2" : "h3"}
                    tone={isCurrentTurnPlayer ? "player" : "default"}
                    muted
                    className={styles.activePlayerName}
                  >
                    {player.name}
                  </MainTextTypography>
                </motion.div>
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
