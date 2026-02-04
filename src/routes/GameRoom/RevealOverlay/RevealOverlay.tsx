/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import styles from "./RevealOverlay.module.scss";
import { OverlayDialog } from "../../../components/OverlayDialog/OverlayDialog";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { LoadableImage } from "../../../components/LoadableImage/LoadableImage";
import { resolvePlacedTierId } from "../../../lib/tierItems";

type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

type Props = {
  triggerReveal: boolean;
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 5000;
const ENTER_MS = 700;
const TIER_REVEAL_DELAY_MS = 3000;

export function ItemPlacementRevealOverlay({ triggerReveal, state }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTier, setShowTier] = useState(false);

  const [placedItemId, setPlacedItemId] = useState<TierItemId | null>(null);
  const [placedTierId, setPlacedTierId] = useState<TierId | null>(null);

  const HOLD_MS = Math.max(0, REVEAL_TOTAL_MS - ENTER_MS);
  const enterS = ENTER_MS / 1000;
  const holdS = HOLD_MS / 1000;

  const totalAnimateS = enterS + holdS;
  const enterFrac = totalAnimateS > 0 ? enterS / totalAnimateS : 1;

  const { itemName, imageSrc, tierName, tierColor } = useMemo(() => {
    const meta = placedItemId ? state?.itemMetaById?.[placedItemId] : undefined;

    const tierMeta = placedTierId
      ? state?.tierMetaById?.[placedTierId]
      : undefined;

    return {
      itemName: meta?.name ?? placedItemId ?? "—",
      imageSrc: meta?.imageSrc,
      tierName: tierMeta?.name ?? placedTierId ?? "—",
      tierColor: tierMeta?.color ?? "transparent",
    };
  }, [state, placedItemId, placedTierId]);

  const placedByPlayerName = useMemo(() => {
    return state?.players?.find((p) => p.id === state.currentTurnPlayerId)
      ?.name;
  }, [state]);

  useEffect(
    function handleTriggerReveal() {
      let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let tierTimeoutId: ReturnType<typeof setTimeout> | null = null;

      if (triggerReveal) {
        const currentItem = state?.currentItem ?? null;
        const placedTier = resolvePlacedTierId(state, currentItem);

        setPlacedItemId(currentItem);
        setPlacedTierId(placedTier);

        setShowTier(false);
        setIsOpen(true);

        tierTimeoutId = setTimeout(() => {
          setShowTier(true);
        }, TIER_REVEAL_DELAY_MS);

        closeTimeoutId = setTimeout(() => {
          setIsOpen(false);
        }, REVEAL_TOTAL_MS);
      }

      return () => {
        if (closeTimeoutId) clearTimeout(closeTimeoutId);
        if (tierTimeoutId) clearTimeout(tierTimeoutId);
      };
    },
    [triggerReveal, state],
  );

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal item placement">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${placedItemId ?? "none"}:${placedTierId ?? "none"}`}
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
              <MainTextTypography variant="h3" className={styles.label}>
                {placedByPlayerName ?? "—"}
              </MainTextTypography>
              <MainTextTypography variant="h5" muted className={styles.label}>
                Placed Item:
              </MainTextTypography>

              <MainTextTypography variant="h3" className={styles.name}>
                {itemName}
              </MainTextTypography>
            </div>

            <div className={styles.tierRevealSlot}>
              <AnimatePresence initial={false}>
                {showTier && placedTierId ? (
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
                    <div className={styles.labelPlaceholder} />
                    <div className={styles.badgePlaceholder} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayDialog>
  );
}
