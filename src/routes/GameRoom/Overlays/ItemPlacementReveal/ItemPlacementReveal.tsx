/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ItemPlacementReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { resolvePlacedTierId } from "../../../../lib/tierItems";
import { OverlayDialog } from "../../../../components/OverlayDialog/OverlayDialog";
import { LoadableImage } from "../../../../components/LoadableImage/LoadableImage";
import { MainTextTypography } from "../../../../components/MainTextTypography/MaintTextTypography";

type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

type Props = {
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 5000;
const ENTER_MS = 700;

const HOLD_MS = Math.max(0, REVEAL_TOTAL_MS - ENTER_MS);
const totalAnimateS = ENTER_MS / 1000 + HOLD_MS / 1000;
const enterFrac = totalAnimateS > 0 ? ENTER_MS / 1000 / totalAnimateS : 1;

export function ItemPlacementReveal({ state }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [placedItemId, setPlacedItemId] = useState<TierItemId | null>(null);
  const [placedTierId, setPlacedTierId] = useState<TierId | null>(null);
  const [openToken, setOpenToken] = useState(0);

  const prevPhaseRef = useRef<RoomPublicState["phase"] | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const id = state?.currentTurnPlayerId ?? null;
    if (!id) return "—";
    return state?.players?.find((p) => p.id === id)?.name ?? "—";
  }, [state]);

  useEffect(
    function handleOpenOnEnteredVote() {
      if (!state) {
        prevPhaseRef.current = null;
        return;
      }

      const prev = prevPhaseRef.current;
      const curr = state.phase;

      const enteredVote = prev !== "VOTE" && curr === "VOTE";
      prevPhaseRef.current = curr;

      if (!enteredVote) return;

      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

      const currentItem = state.currentItem ?? null;

      const placedTier =
        state.pendingTierId ?? resolvePlacedTierId(state, currentItem);

      setPlacedItemId(currentItem);
      setPlacedTierId(placedTier);

      setIsOpen(true);
      setOpenToken((t) => t + 1);

      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, REVEAL_TOTAL_MS);

      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [state?.phase, state?.currentItem, state?.pendingTierId, !!state],
  );

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal item placement">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${openToken}:${placedItemId ?? "none"}:${placedTierId ?? "none"}`}
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
                {placedByPlayerName} Placed: {itemName}
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
