import { useRef } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { getPlayersInTurnDisplayOrder } from "@/lib/players";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";
import styles from "./ActivePlayersCard.module.scss";

type RoomPublicState = Contracts.RoomPublicState;
type Player = RoomPublicState["players"][number];
type VoteValue = Contracts.VoteValue;

type VoteIndicatorMeta = {
  Icon: typeof APP_ICONS.vote.up;
  magnitudeText: string;
  label: string;
};

const voteIndicatorMetaByValue = new Map<VoteValue, VoteIndicatorMeta>([
  [-2, { Icon: APP_ICONS.vote.up, magnitudeText: "2", label: "drift up 2" }],
  [-1, { Icon: APP_ICONS.vote.up, magnitudeText: "1", label: "drift up 1" }],
  [0, { Icon: APP_ICONS.vote.agree, magnitudeText: "-", label: "agree" }],
  [1, { Icon: APP_ICONS.vote.down, magnitudeText: "1", label: "drift down 1" }],
  [2, { Icon: APP_ICONS.vote.down, magnitudeText: "2", label: "drift down 2" }],
]);

function getVoteIndicatorMeta(vote: VoteValue): VoteIndicatorMeta {
  return voteIndicatorMetaByValue.get(vote) ?? voteIndicatorMetaByValue.get(0)!;
}

type ActivePlayersCardProps = {
  state: RoomPublicState;
};

function ActivePlayerRow({
  player,
  isCurrentTurnPlayer,
  vote,
  isVoteConfirmed,
  showVoteStatus,
}: {
  player: Player;
  isCurrentTurnPlayer: boolean;
  vote: VoteValue | null;
  isVoteConfirmed: boolean;
  showVoteStatus: boolean;
}) {
  const playerNameRef = useRef<HTMLSpanElement | null>(null);

  const voteWatchKey =
    vote === null
      ? "none"
      : `${vote}:${isVoteConfirmed ? "locked" : "pending"}`;

  useAutoFitText(playerNameRef, {
    minFontSizePx: 10,
    watch: `${player.name}:${isCurrentTurnPlayer ? "current" : "normal"}:${voteWatchKey}`,
  });

  const voteMeta = vote !== null ? getVoteIndicatorMeta(vote) : null;
  const voteIconProps = ICON_PROPS.vote.controls;
  const voteAriaPrefix = isVoteConfirmed ? "Locked vote" : "Queued vote";

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
      {showVoteStatus && voteMeta ? (
        <span
          className={clsx(
            styles.voteIndicator,
            vote === -2 && styles.voteToneUp2,
            vote === -1 && styles.voteToneUp1,
            vote === 0 && styles.voteToneAgree,
            vote === 1 && styles.voteToneDown1,
            vote === 2 && styles.voteToneDown2,
            isVoteConfirmed
              ? styles.voteIndicatorLocked
              : styles.voteIndicatorPending,
          )}
          role="img"
          aria-label={`${voteAriaPrefix}: ${voteMeta.label}`}
        >
          <voteMeta.Icon
            className={styles.voteIndicatorIcon}
            {...voteIconProps}
            size={20}
            strokeWidth={2.6}
            aria-hidden
          />
          <span className={styles.voteIndicatorMagnitude} aria-hidden>
            {voteMeta.magnitudeText}
          </span>
        </span>
      ) : null}
    </motion.div>
  );
}

export function ActivePlayersCard({ state }: ActivePlayersCardProps) {
  const currentTurnPlayerId = state.currentTurnPlayerId ?? null;
  const playersInDisplayOrder = getPlayersInTurnDisplayOrder(state);
  const shouldShowVoteStatus = state.phase === "VOTE";

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
              const vote =
                shouldShowVoteStatus && !isCurrentTurnPlayer
                  ? (state.votes?.[player.id] ?? null)
                  : null;
              const isVoteConfirmed =
                shouldShowVoteStatus &&
                !isCurrentTurnPlayer &&
                !!state.voteConfirmedByPlayerId?.[player.id];

              return (
                <ActivePlayerRow
                  key={player.id}
                  player={player}
                  isCurrentTurnPlayer={isCurrentTurnPlayer}
                  vote={vote}
                  isVoteConfirmed={isVoteConfirmed}
                  showVoteStatus={shouldShowVoteStatus}
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
