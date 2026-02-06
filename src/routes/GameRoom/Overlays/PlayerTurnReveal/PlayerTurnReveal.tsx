import styles from "./PlayerTurnReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { getPlayerNameById } from "@/lib/players";
import { buildHoldSlideAnimation } from "@/lib/motionPresets";
type RoomPublicState = Contracts.RoomPublicState;

type PlayerTurnRevealProps = {
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 3000;
const ENTER_MS = 700;

export function PlayerTurnReveal({ state }: PlayerTurnRevealProps) {
  const prefersReducedMotion = useReducedMotion();
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
  const slide = buildHoldSlideAnimation({
    axis: "y",
    enterFrom: "30vh",
    exitTo: -10,
    totalMs: REVEAL_TOTAL_MS,
    enterMs: ENTER_MS,
    enterScale: 0.98,
    exitScale: 0.985,
    reduceMotion: prefersReducedMotion,
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
            <MainTextTypography
              variant="h2"
              className={styles.line}
              textAlign="center"
            >
              IT'S
            </MainTextTypography>

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
