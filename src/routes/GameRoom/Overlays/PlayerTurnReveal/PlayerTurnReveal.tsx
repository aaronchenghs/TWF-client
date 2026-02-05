import styles from "./PlayerTurnReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { getPlayerNameById } from "@/lib/players";
type RoomPublicState = Contracts.RoomPublicState;

type PlayerTurnRevealProps = {
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 4000;
const ENTER_MS = 700;
const HOLD_MS = Math.max(0, REVEAL_TOTAL_MS - ENTER_MS);
const totalAnimateS = ENTER_MS / 1000 + HOLD_MS / 1000;
const enterFrac = totalAnimateS > 0 ? ENTER_MS / 1000 / totalAnimateS : 1;

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

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal turn player">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${state?.currentTurnPlayerId ?? "none"}:${token}`}
            className={styles.reveal}
            initial={{ y: "30vh", opacity: 0, scale: 0.98 }}
            animate={{
              y: ["30vh", 0, 0],
              opacity: [0, 1, 1],
              scale: [0.98, 1, 1],
              transition: {
                duration: totalAnimateS,
                times: [0, enterFrac, 1],
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.985,
              transition: { duration: 0.16, ease: [0.2, 0.9, 0.2, 1] },
            }}
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
