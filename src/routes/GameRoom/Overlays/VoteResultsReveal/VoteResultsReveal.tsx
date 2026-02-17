import { useMemo } from "react";
import clsx from "clsx";
import styles from "./VoteResultsReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowBigUpDash,
  ArrowBigDownDash,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import {
  buildFadeSlideScaleAnimation,
  buildHoldSlideAnimation,
  MOTION_EASE,
} from "@/lib/motionPresets";

type RoomPublicState = Contracts.RoomPublicState;
type VoteValue = Contracts.VoteValue;

type VoteBucket = "up" | "agree" | "down";

const REVEAL_TOTAL_MS = 6000;
const ENTER_MS = 700;
const COLUMN_DELAY_BASE = 0.16;
const COLUMN_DELAY_STEP = 0.08;
const COLUMN_IN_DURATION = 0.3;

const voteConfig: Array<{
  key: VoteBucket;
  label: string;
  icon: LucideIcon;
  value: VoteValue;
}> = [
  { key: "up", label: "Drift Up", icon: ArrowBigUpDash, value: -1 },
  { key: "agree", label: "Agree", icon: Minus, value: 0 },
  { key: "down", label: "Drift Down", icon: ArrowBigDownDash, value: 1 },
];

export function VoteResultsReveal({
  state,
}: {
  state: RoomPublicState | null;
}) {
  const meta = state?.currentItem
    ? state?.itemMetaById?.[state.currentItem]
    : undefined;
  const itemName = meta?.name ?? state?.currentItem ?? "--";
  const imageSrc = meta?.imageSrc;

  const { isOpen, token } = usePhaseStartOverlay(state, {
    openOnPhase: "RESULTS",
    openMs: REVEAL_TOTAL_MS,
    closeIfPhaseMismatch: true,
    shouldOpen: () => !!state?.currentItem,
    skipInitialOpen: true,
  });

  const slideAnimation = buildHoldSlideAnimation({
    axis: "x",
    enterFrom: "-110vw",
    exitTo: "-10vw",
    totalMs: REVEAL_TOTAL_MS,
    enterMs: ENTER_MS,
    enterScale: 0.96,
    exitScale: 0.985,
    reduceMotion: false,
  });

  const { voteCounts, votersCount } = useMemo(() => {
    const emptyCounts: Record<VoteBucket, number> = {
      up: 0,
      agree: 0,
      down: 0,
    };

    if (!state) return { voteCounts: emptyCounts, votersCount: 0 };

    const orderedVotes = Object.values(state.votes ?? {}) as VoteValue[];

    const voteCounts = orderedVotes.reduce(
      (acc, value) => {
        if (value === -1) acc.up += 1;
        else if (value === 1) acc.down += 1;
        else acc.agree += 1;

        return acc;
      },
      { up: 0, agree: 0, down: 0 } as Record<VoteBucket, number>,
    );

    return { voteCounts, votersCount: orderedVotes.length };
  }, [state]);

  return (
    <OverlayDialog open={isOpen} ariaLabel="Reveal vote results">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={`${token}:${state?.currentItem ?? "none"}`}
            className={styles.reveal}
            {...slideAnimation}
          >
            <div className={styles.header}>
              <div className={styles.titleBlock}>
                <MainTextTypography
                  variant="display"
                  className={styles.title}
                  textAlign="left"
                >
                  RESULTS!
                </MainTextTypography>

                <MainTextTypography
                  variant="label"
                  className={styles.subtitle}
                  textAlign="left"
                  letterSpacing="wide"
                >
                  Votes revealed: {votersCount}
                </MainTextTypography>
              </div>

              <div className={styles.itemChip}>
                <div className={styles.itemThumb}>
                  <LoadableImage
                    src={imageSrc}
                    alt={itemName}
                    loading="eager"
                    fetchPriority="high"
                    className={styles.itemThumbImg}
                    fallback={
                      <div className={styles.itemThumbFallback}>
                        {itemName.slice(0, 1).toUpperCase()}
                      </div>
                    }
                  />
                </div>

                <MainTextTypography variant="h3" className={styles.itemName}>
                  {itemName}
                </MainTextTypography>
              </div>
            </div>

            <div className={styles.columns}>
              {voteConfig.map((config, idx) => {
                const count = voteCounts[config.key];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={config.key}
                    className={clsx(styles.column, styles[`col_${config.key}`])}
                    {...buildFadeSlideScaleAnimation({
                      axis: "y",
                      enterOffset: 28,
                      enterScale: 0.78,
                      durationMs: COLUMN_IN_DURATION * 1000,
                      delay: COLUMN_DELAY_BASE + idx * COLUMN_DELAY_STEP,
                      ease: MOTION_EASE.enter,
                      reduceMotion: false,
                    })}
                  >
                    <MainTextTypography
                      variant="h2"
                      className={styles.columnIcon}
                      textAlign="center"
                    >
                      <Icon
                        className={styles.columnIconSvg}
                        size={50}
                        strokeWidth={3}
                        aria-hidden
                      />
                    </MainTextTypography>
                    <MainTextTypography
                      variant="h3"
                      className={styles.columnTitle}
                      letterSpacing="wide"
                      textAlign="center"
                    >
                      {config.label}
                    </MainTextTypography>
                    <MainTextTypography
                      variant="display"
                      className={styles.columnCount}
                      textAlign="center"
                    >
                      {count}
                    </MainTextTypography>
                    <MainTextTypography
                      variant="label"
                      className={styles.columnCountLabel}
                      letterSpacing="wide"
                      textAlign="center"
                    >
                      {count === 1 ? "vote" : "votes"}
                    </MainTextTypography>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayDialog>
  );
}
