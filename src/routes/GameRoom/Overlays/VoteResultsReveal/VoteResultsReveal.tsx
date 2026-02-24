import { useMemo } from "react";
import clsx from "clsx";
import styles from "./VoteResultsReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import pluralize from "pluralize";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
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
  icon: typeof APP_ICONS.vote.up;
  value: VoteValue;
}> = [
  { key: "up", icon: APP_ICONS.vote.up, value: -1 },
  { key: "agree", icon: APP_ICONS.vote.agree, value: 0 },
  { key: "down", icon: APP_ICONS.vote.down, value: 1 },
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
    exitScale: 0.98,
    reduceMotion: false,
  });

  const voteCounts = useMemo(() => {
    const emptyCounts: Record<VoteBucket, number> = {
      up: 0,
      agree: 0,
      down: 0,
    };

    if (!state) return emptyCounts;

    const orderedVotes = Object.values(state.votes ?? {}) as VoteValue[];

    const voteCounts = orderedVotes.reduce(
      (acc, value) => {
        if (value <= -1) acc.up += 1;
        else if (value >= 1) acc.down += 1;
        else acc.agree += 1;

        return acc;
      },
      { up: 0, agree: 0, down: 0 } as Record<VoteBucket, number>,
    );

    return voteCounts;
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
                        {...ICON_PROPS.vote.results}
                        aria-hidden
                      />
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
                      {pluralize("vote", count)}
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
