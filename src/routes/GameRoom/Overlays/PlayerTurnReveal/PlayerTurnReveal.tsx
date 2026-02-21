import styles from "./PlayerTurnReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { getPlayerNameById } from "@/lib/players";
import { buildHoldSlideAnimation } from "@/lib/motionPresets";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
type RoomPublicState = Contracts.RoomPublicState;

type PlayerTurnRevealProps = {
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 3000;
const ENTER_MS = 700;

export function PlayerTurnReveal({ state }: PlayerTurnRevealProps) {
  const { isOpen, token } = usePhaseStartOverlay(state, {
    openOnPhase: "PLACE",
    reopenKey: state?.currentTurnPlayerId ?? null,
    openMs: REVEAL_TOTAL_MS,
    closeIfPhaseMismatch: true,
    shouldOpen: () => !!state?.currentTurnPlayerId,
  });

  const playerName = getPlayerNameById(
    state?.players ?? [],
    state?.currentTurnPlayerId ?? null,
    "--",
  );

  const currentTurnPlayer = state?.currentTurnPlayerId
    ? (state?.players.find(
        (player) => player.id === state.currentTurnPlayerId,
      ) ?? null)
    : null;

  const slide = buildHoldSlideAnimation({
    axis: "x",
    enterFrom: "-110vw",
    exitTo: "-10vw",
    totalMs: REVEAL_TOTAL_MS,
    enterMs: ENTER_MS,
    enterScale: 0.98,
    exitScale: 0.985,
    reduceMotion: false,
  });

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal turn player">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${state?.currentTurnPlayerId ?? "none"}:${token}`}
            className={styles.reveal}
            {...slide}
          >
            <PlayerAvatar
              avatar={currentTurnPlayer?.avatar}
              size={100}
              className={styles.avatar}
              sway
            />

            <MainTextTypography
              variant="display"
              className={styles.name}
              textAlign="center"
              weight="black"
              tone="player"
            >
              {playerName}
              {"'s"}
            </MainTextTypography>

            <MainTextTypography
              variant="h2"
              className={styles.line}
              textAlign="center"
            >
              TURN!
            </MainTextTypography>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayDialog>
  );
}
