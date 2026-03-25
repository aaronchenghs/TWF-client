import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./CountdownOverlay.module.scss";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { DEFAULT_TIER_COLORS } from "../../../lib/constants/colors";
import One from "../../../assets/public/1.svg?react";
import Two from "../../../assets/public/2.svg?react";
import Three from "../../../assets/public/3.svg?react";
import { OverlayDialog } from "../../../components/OverlayDialog/OverlayDialog";

const COUNTDOWN_PACE = 600;
const OUT_MS = 140;
const VISIBLE_MS = Math.max(0, COUNTDOWN_PACE - OUT_MS);
const FINAL_EXIT_MS = 220;

type Props = {
  open: boolean;
  onCancel: () => void;
  onComplete: () => void;
  onDisplayCountChange?: (count: 3 | 2 | 1 | null) => void;
  seconds?: 3 | 2 | 1;
};

export function CountdownOverlay({
  open,
  onCancel,
  onComplete,
  onDisplayCountChange,
  seconds = 3,
}: Props) {
  const [displayCount, setDisplayCount] = useState<number>(seconds);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [isCompleting, setIsCompleting] = useState(false);
  const [color, setColor] = useState<string>(() => pickRandomColor());

  const timersRef = useRef<number[]>([]);
  const Svg = displayCount === 3 ? Three : displayCount === 2 ? Two : One;

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  const hardReset = useCallback(() => {
    clearAllTimers();
    setPhase("in");
    setIsCompleting(false);
    setDisplayCount(seconds);
    setColor((prev) => pickRandomColor(prev));
  }, [clearAllTimers, seconds]);

  const handleCancel = useCallback(() => {
    if (isCompleting) return;
    hardReset();
    onCancel();
  }, [hardReset, isCompleting, onCancel]);

  useEffect(
    function runCountdownSequence() {
      if (!open) {
        clearAllTimers();
        setIsCompleting(false);
        onDisplayCountChange?.(null);
        return;
      }

      clearAllTimers();

      const startCount = seconds;

      schedule(() => {
        setPhase("in");
        setIsCompleting(false);
        setDisplayCount(startCount);
        setColor((prev) => pickRandomColor(prev));
        onDisplayCountChange?.(startCount);
      }, 0);

      const counts = Array.from(
        { length: startCount },
        (_, i) => startCount - i,
      );

      counts.forEach((n) => {
        const base = (startCount - n) * COUNTDOWN_PACE;

        schedule(() => {
          if (n === 1) {
            setIsCompleting(true);
            return;
          }

          setPhase("out");
        }, base + VISIBLE_MS);

        if (n > 1) {
          schedule(() => {
            const nextCount = (n - 1) as 2 | 1;
            setDisplayCount(nextCount);
            setPhase("in");
            setColor((prev) => pickRandomColor(prev));
            onDisplayCountChange?.(nextCount);
          }, base + COUNTDOWN_PACE);
        } else {
          schedule(
            () => {
              onComplete();
            },
            base + VISIBLE_MS + FINAL_EXIT_MS,
          );
        }
      });

      return () => {
        clearAllTimers();
      };
    },
    [open, seconds, onComplete, onDisplayCountChange, clearAllTimers, schedule],
  );

  return (
    <OverlayDialog
      open={open}
      ariaLabel="Starting game"
      onEscape={isCompleting ? undefined : handleCancel}
      usePortal
    >
      <div className={styles.content}>
        <div className={styles.stage}>
          <Svg
            className={clsx(
              styles.countSvg,
              isCompleting
                ? styles.finalOut
                : phase === "in"
                  ? styles.in
                  : styles.out,
            )}
            style={{ color }}
            aria-label={`${displayCount}`}
          />
        </div>

        <div
          className={clsx(
            styles.actions,
            isCompleting && styles.actionsExiting,
          )}
        >
          <AccentButton
            variant="secondary"
            onClick={handleCancel}
            disabled={isCompleting}
          >
            Cancel
          </AccentButton>
        </div>
      </div>
    </OverlayDialog>
  );
}

function pickRandomColor(prev?: string) {
  const colorArray = Array.from(DEFAULT_TIER_COLORS);
  const n = colorArray.length;

  const prevIndex = prev ? colorArray.indexOf(prev) : -1;

  const offset =
    prevIndex >= 0
      ? 1 + Math.floor(Math.random() * (n - 1))
      : Math.floor(Math.random() * n);

  return colorArray[(Math.max(prevIndex, 0) + offset) % n];
}
