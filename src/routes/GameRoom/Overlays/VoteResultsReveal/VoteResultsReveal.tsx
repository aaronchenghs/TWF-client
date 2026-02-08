import { useMemo } from "react";
import clsx from "clsx";
import styles from "./VoteResultsReveal.module.scss";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { OverlayDialog } from "@/components/OverlayDialog/OverlayDialog";
import { usePhaseStartOverlay } from "@/lib/hooks/usePhaseStartOverlay";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import { getPlayerNameById } from "@/lib/players";
import {
  buildFadeSlideScaleAnimation,
  buildHoldSlideAnimation,
  MOTION_EASE,
} from "@/lib/motionPresets";
import { Pill } from "@/components/Pill/Pill";

type RoomPublicState = Contracts.RoomPublicState;
type PlayerId = Contracts.PlayerId;
type VoteValue = Contracts.VoteValue;

type VoteEntry = {
  playerId: PlayerId;
  name: string;
  value: VoteValue;
};

type VoteBucket = "up" | "agree" | "down";

const REVEAL_TOTAL_MS = 5200;
const ENTER_MS = 700;
const COLUMN_DELAY_BASE = 0.1;
const COLUMN_DELAY_STEP = 0.06;
const COLUMN_IN_DURATION = 0.24;
const CHIP_STAGGER = 0.05;
const CHIP_DELAY = 0.08;
const CHIP_IN_DURATION = 0.18;
const CHIP_OFFSET_Y = 8;
const CHIP_SCALE = 0.96;

const voteConfig: Array<{
  key: VoteBucket;
  label: string;
  icon: string;
  value: VoteValue;
}> = [
  { key: "up", label: "Drift Up", icon: "▲", value: -1 },
  { key: "agree", label: "Agree", icon: "●", value: 0 },
  { key: "down", label: "Drift Down", icon: "▼", value: 1 },
];

export function VoteResultsReveal({
  state,
}: {
  state: RoomPublicState | null;
}) {
  const { isOpen, token } = usePhaseStartOverlay(state, {
    openOnPhase: "RESULTS",
    openMs: REVEAL_TOTAL_MS,
    closeIfPhaseMismatch: true,
    shouldOpen: () => !!state?.currentItem,
    skipInitialOpen: true,
  });

  const { voteBuckets, votersCount } = useMemo(() => {
    const emptyBuckets: Record<VoteBucket, VoteEntry[]> = {
      up: [],
      agree: [],
      down: [],
    };

    if (!state) return { voteBuckets: emptyBuckets, votersCount: 0 };

    const players = state.players ?? [];
    const orderById = new Map<PlayerId, number>(
      players.map((p, idx) => [p.id, idx]),
    );

    const orderedVotes = (
      Object.entries(state.votes ?? {}) as Array<[PlayerId, VoteValue]>
    ).sort(
      (a, b) => (orderById.get(a[0]) ?? 9999) - (orderById.get(b[0]) ?? 9999),
    );

    const voteBuckets = orderedVotes.reduce(
      (acc, [playerId, value]) => {
        const name = getPlayerNameById(players, playerId, "Unknown");
        const entry: VoteEntry = { playerId, name, value };

        if (value === -1) acc.up.push(entry);
        else if (value === 1) acc.down.push(entry);
        else acc.agree.push(entry);

        return acc;
      },
      { up: [], agree: [], down: [] } as Record<VoteBucket, VoteEntry[]>,
    );

    return { voteBuckets, votersCount: orderedVotes.length };
  }, [state]);

  const meta = state?.currentItem
    ? state?.itemMetaById?.[state.currentItem]
    : undefined;
  const itemName = meta?.name ?? state?.currentItem ?? "--";
  const imageSrc = meta?.imageSrc;

  const listVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: CHIP_STAGGER, delayChildren: CHIP_DELAY },
    },
  };

  const chipVariants = {
    hidden: { opacity: 0, y: CHIP_OFFSET_Y, scale: CHIP_SCALE },
    show: { opacity: 1, y: 0, scale: 1 },
  };

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
                  variant="caption"
                  className={styles.subtitle}
                  textAlign="left"
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

                <MainTextTypography variant="h5" className={styles.itemName}>
                  {itemName}
                </MainTextTypography>
              </div>
            </div>

            <div className={styles.columns}>
              {voteConfig.map((config, idx) => {
                const entries = voteBuckets[config.key];
                return (
                  <motion.div
                    key={config.key}
                    className={clsx(styles.column, styles[`col_${config.key}`])}
                    {...buildFadeSlideScaleAnimation({
                      axis: "y",
                      enterOffset: 12,
                      durationMs: COLUMN_IN_DURATION * 1000,
                      delay: COLUMN_DELAY_BASE + idx * COLUMN_DELAY_STEP,
                      ease: MOTION_EASE.enter,
                      reduceMotion: false,
                    })}
                  >
                    <div className={styles.columnHeader}>
                      <span className={styles.columnTitle}>{config.label}</span>
                      <Pill size="sm" className={styles.countPill}>
                        {entries.length}
                      </Pill>
                    </div>

                    {entries.length ? (
                      <motion.ul
                        className={styles.voteList}
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                      >
                        {entries.map((entry) => (
                          <motion.li
                            key={`${entry.playerId}:${entry.value}`}
                            className={styles.voteChip}
                            variants={chipVariants}
                            transition={
                              {
                                duration: CHIP_IN_DURATION,
                                ease: MOTION_EASE.enter,
                              }
                            }
                          >
                            <span className={styles.voteIcon}>
                              {config.icon}
                            </span>
                            <span className={styles.voteName}>
                              {entry.name}
                            </span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    ) : (
                      <div className={styles.empty}>No votes</div>
                    )}
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
