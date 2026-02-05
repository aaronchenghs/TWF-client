import styles from "./ItemPlacementReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { resolvePlacedTierId } from "@/lib/tierItems";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { getPlayerNameById } from "@/lib/players";

type RoomPublicState = Contracts.RoomPublicState;

type Props = {
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 5000;
const ENTER_MS = 700;

const HOLD_MS = Math.max(0, REVEAL_TOTAL_MS - ENTER_MS);
const totalAnimateS = ENTER_MS / 1000 + HOLD_MS / 1000;
const enterFrac = totalAnimateS > 0 ? ENTER_MS / 1000 / totalAnimateS : 1;

export function ItemPlacementReveal({ state }: Props) {
  const { isOpen, token } = usePhaseStartOverlay(state, {
    openOnPhase: "VOTE",
    openMs: REVEAL_TOTAL_MS,
    closeIfPhaseMismatch: true,
    shouldOpen: () => !!state?.currentItem,
  });

  const placedItemId = state?.currentItem ?? null;
  const placedTierId = resolvePlacedTierId(state, placedItemId);

  const meta = placedItemId ? state?.itemMetaById?.[placedItemId] : undefined;
  const tierMeta = placedTierId
    ? state?.tierMetaById?.[placedTierId]
    : undefined;

  const itemName = meta?.name ?? placedItemId ?? "--";
  const imageSrc = meta?.imageSrc;
  const tierName = tierMeta?.name ?? placedTierId ?? "--";
  const tierColor = tierMeta?.color ?? "transparent";

  const placedByPlayerName = getPlayerNameById(
    state?.players ?? [],
    state?.currentTurnPlayerId ?? null,
    "--",
  );

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal item placement">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${token}:${placedItemId ?? "none"}:${placedTierId ?? "none"}`}
            className={styles.reveal}
            initial={{ x: "-125vw", opacity: 0 }}
            animate={{
              x: ["-125vw", 0, 0],
              opacity: [0, 1, 1],
              transition: {
                duration: totalAnimateS,
                times: [0, enterFrac, 1],
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            exit={{
              opacity: 0,
              x: "-10vw",
              transition: { duration: 0.16, ease: [0.2, 0.9, 0.2, 1] },
            }}
          >
            <LoadableImage
              src={imageSrc}
              alt={itemName}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={styles.revealImage}
              fallback={
                <div className={styles.fallback} aria-hidden="true">
                  <MainTextTypography variant="h2">
                    {itemName}
                  </MainTextTypography>
                </div>
              }
            />

            <div className={styles.text}>
              <MainTextTypography variant="h4" className={styles.name}>
                <MainTextTypography variant="h4" tone="player">
                  {placedByPlayerName}
                </MainTextTypography>{" "}
                Placed: {itemName}
              </MainTextTypography>
            </div>

            <div className={styles.tierRevealSlot}>
              {placedTierId ? (
                <motion.div
                  key="tier"
                  className={styles.placedIntoRow}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.985 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.9, 0.2, 1] }}
                >
                  <div
                    className={styles.tierBadge}
                    style={{ backgroundColor: tierColor }}
                  >
                    <MainTextTypography variant="h5" weight="bold">
                      {tierName}
                    </MainTextTypography>
                  </div>
                </motion.div>
              ) : (
                <div
                  className={styles.placedIntoRowPlaceholder}
                  aria-hidden="true"
                >
                  <div className={styles.badgePlaceholder} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayDialog>
  );
}
