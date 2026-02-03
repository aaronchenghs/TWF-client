import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./CountdownOverlay.module.scss";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { DEFAULT_TIER_COLORS } from "../../../lib/colors";
import One from "../../../assets/public/1.svg?react";
import Two from "../../../assets/public/2.svg?react";
import Three from "../../../assets/public/3.svg?react";
import { OverlayDialog } from "../../../components/OverlayDialog/OverlayDialog";

const COUNTDOWN_PACE = 600;
const OUT_MS = 140;
const VISIBLE_MS = Math.max(0, COUNTDOWN_PACE - OUT_MS);

type Props = {
  open: boolean;
  onCancel: () => void;
  onComplete: () => void;
  seconds?: 3 | 2 | 1;
};

export function CountdownOverlay({
  open,
  onCancel,
  onComplete,
  seconds = 3,
}: Props) {
  const [displayCount, setDisplayCount] = useState<number>(seconds);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [color, setColor] = useState<string>(() => pickRandomColor());

  const timersRef = useRef<number[]>([]);

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
    setDisplayCount(seconds);
    setColor((prev) => pickRandomColor(prev));
  }, [clearAllTimers, seconds]);

  const handleCancel = useCallback(() => {
    hardReset();
    onCancel();
  }, [hardReset, onCancel]);

  useEffect(() => {
    if (!open) {
      clearAllTimers();
      return;
    }

    clearAllTimers();

    const startCount = seconds;

    schedule(() => {
      setPhase("in");
      setDisplayCount(startCount);
      setColor((prev) => pickRandomColor(prev));
    }, 0);

    const counts = Array.from({ length: startCount }, (_, i) => startCount - i);

    counts.forEach((n) => {
      const base = (startCount - n) * COUNTDOWN_PACE;

      schedule(() => {
        setPhase("out");
      }, base + VISIBLE_MS);

      if (n > 1) {
        schedule(() => {
          setDisplayCount(n - 1);
          setPhase("in");
          setColor((prev) => pickRandomColor(prev));
        }, base + COUNTDOWN_PACE);
      } else {
        schedule(() => {
          onComplete();
        }, base + COUNTDOWN_PACE);
      }
    });

    return () => {
      clearAllTimers();
    };
  }, [open, seconds, onComplete, clearAllTimers, schedule]);

  const Svg = useMemo(() => {
    if (displayCount === 3) return Three;
    if (displayCount === 2) return Two;
    return One;
  }, [displayCount]);

  return (
    <OverlayDialog
      open={open}
      ariaLabel="Starting game"
      onEscape={handleCancel}
    >
      <div className={styles.content}>
        <div className={styles.stage}>
          <Svg
            className={clsx(
              styles.countSvg,
              phase === "in" ? styles.in : styles.out,
            )}
            style={{ color }}
            aria-label={`${displayCount}`}
          />
        </div>

        <div className={styles.actions}>
          <AccentButton variant="secondary" onClick={handleCancel}>
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
