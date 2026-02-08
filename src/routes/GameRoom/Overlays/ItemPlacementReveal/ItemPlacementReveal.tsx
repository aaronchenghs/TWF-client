import styles from "./ItemPlacementReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { resolvePlacedTierId } from "@/lib/tierItems";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { getPlayerNameById } from "@/lib/players";
import {
  buildFadeSlideScaleAnimation,
  buildHoldSlideAnimation,
  MOTION_EASE,
} from "@/lib/motionPresets";

type RoomPublicState = Contracts.RoomPublicState;

type Props = {
  state: RoomPublicState | null;
};

const REVEAL_TOTAL_MS = 5000;
const ENTER_MS = 700;

export function ItemPlacementReveal({ state }: Props) {
  const { isOpen, token } = usePhaseStartOverlay(state, {
    openOnPhase: "VOTE",
    openMs: REVEAL_TOTAL_MS,
    closeIfPhaseMismatch: true,
    shouldOpen: () => !!state?.currentItem,
    skipInitialOpen: true,
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
  const slide = buildHoldSlideAnimation({
    axis: "x",
    enterFrom: "-125vw",
    exitTo: "-10vw",
    totalMs: REVEAL_TOTAL_MS,
    enterMs: ENTER_MS,
    reduceMotion: false,
  });

  const tierRevealMotion = buildFadeSlideScaleAnimation({
    axis: "y",
    enterOffset: 10,
    exitOffset: -6,
    enterScale: 0.98,
    exitScale: 0.985,
    durationMs: 180,
    ease: MOTION_EASE.exit,
    reduceMotion: false,
    includeExit: true,
  });

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal item placement">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${token}:${placedItemId ?? "none"}:${placedTierId ?? "none"}`}
            className={styles.reveal}
            {...slide}
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
                  {...tierRevealMotion}
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
