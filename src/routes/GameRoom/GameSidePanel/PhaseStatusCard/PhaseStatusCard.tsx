import { memo, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { usePhaseClock } from "@/lib/hooks/usePhaseClock";
import { useGameRoomSoundEffects } from "@/lib/hooks/useSoundEffects";
import { GameStatusCard } from "../GameStatusCard/GameStatusCard";
import styles from "./PhaseStatusCard.module.scss";

type RoomPublicState = Contracts.RoomPublicState;
type Phase = RoomPublicState["phase"];

type PhaseStatusCardProps = {
  state: RoomPublicState;
};

const PHASES_WITHOUT_COUNTDOWN = new Set<Phase>([
  "STARTING",
  "RESULTS",
  "FINISHED",
]);

export function PhaseStatusCard({ state }: PhaseStatusCardProps) {
  const [phaseRingSize, setPhaseRingSize] = useState({ width: 0, height: 0 });
  const phaseCardRef = useRef<HTMLElement | null>(null);

  const phaseClock = usePhaseClock(state, 50);
  const shouldHideCountdown = PHASES_WITHOUT_COUNTDOWN.has(state.phase);
  const ringProgress01 = shouldHideCountdown ? 1 : (phaseClock.progress01 ?? 0);
  const isPhaseCritical =
    !shouldHideCountdown &&
    phaseClock.endsAt != null &&
    phaseClock.secondsLeft != null &&
    phaseClock.secondsLeft > 0 &&
    phaseClock.secondsLeft <= 5;

  useGameRoomSoundEffects({ isPhaseCritical });

  const phaseRing = useMemo(() => {
    const inset = 4;
    const outerWidth = Math.max(0, phaseRingSize.width);
    const outerHeight = Math.max(0, phaseRingSize.height);
    const width = Math.max(0, outerWidth - inset * 2);
    const height = Math.max(0, outerHeight - inset * 2);
    const radius = Math.max(0, Math.min(14, width / 2, height / 2));

    const perimeter =
      width > 0 && height > 0
        ? 2 * (width + height - 4 * radius) + 2 * Math.PI * radius
        : 0;
    const dash = ringProgress01 * perimeter;
    const gap = perimeter * 2;

    const left = inset;
    const top = inset;
    const right = inset + width;
    const bottom = inset + height;
    const topCenterX = inset + width / 2;
    const topRightX = right - radius;
    const topLeftX = left + radius;
    const bottomRightY = bottom - radius;
    const topRightY = top + radius;
    const bottomLeftY = bottom - radius;
    const topLeftY = top + radius;
    const bottomLeftX = left + radius;
    const bottomRightX = right - radius;

    const d =
      width > 0 && height > 0
        ? `M ${topCenterX} ${top} ` +
          `H ${topRightX} ` +
          `A ${radius} ${radius} 0 0 1 ${right} ${topRightY} ` +
          `V ${bottomRightY} ` +
          `A ${radius} ${radius} 0 0 1 ${bottomRightX} ${bottom} ` +
          `H ${bottomLeftX} ` +
          `A ${radius} ${radius} 0 0 1 ${left} ${bottomLeftY} ` +
          `V ${topLeftY} ` +
          `A ${radius} ${radius} 0 0 1 ${topLeftX} ${top} ` +
          `H ${topCenterX}`
        : "";

    return {
      viewBox: `0 0 ${Math.max(outerWidth, 1)} ${Math.max(outerHeight, 1)}`,
      d,
      dashArray: `${dash} ${gap}`,
    };
  }, [ringProgress01, phaseRingSize.height, phaseRingSize.width]);

  useEffect(function trackPhaseCardSize() {
    const element = phaseCardRef.current;
    if (!element) return;

    const readSize = () => {
      const rect = element.getBoundingClientRect();
      setPhaseRingSize((prev) => {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };

    readSize();

    const observer = new ResizeObserver(() => {
      readSize();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <GameStatusCard
      className={clsx(
        styles.phaseCard,
        isPhaseCritical && styles.phaseCardCritical,
      )}
      cardRef={phaseCardRef}
    >
      <PhaseProgressRing phaseRing={phaseRing} />

      <div className={clsx(styles.itemRow, styles.phaseCardContent)}>
        <MainTextTypography variant="h2" className={styles.bigText}>
          {state.phase}
        </MainTextTypography>

        {!shouldHideCountdown && (
          <MainTextTypography variant="h2">
            {phaseClock.secondsLeft ?? "--"}
          </MainTextTypography>
        )}
      </div>
    </GameStatusCard>
  );
}

type PhaseRingPath = {
  viewBox: string;
  d: string;
  dashArray: string;
};

const PhaseProgressRing = memo(function PhaseProgressRing({
  phaseRing,
}: {
  phaseRing: PhaseRingPath;
}) {
  return (
    <svg
      className={styles.phaseProgressRing}
      viewBox={phaseRing.viewBox}
      aria-hidden="true"
    >
      <path className={styles.phaseProgressTrack} d={phaseRing.d} />
      <path
        className={styles.phaseProgressActive}
        d={phaseRing.d}
        strokeDasharray={phaseRing.dashArray}
        strokeDashoffset={0}
      />
    </svg>
  );
});
