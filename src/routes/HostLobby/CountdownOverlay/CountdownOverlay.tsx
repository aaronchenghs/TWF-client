import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./CountdownOverlay.module.scss";
import oneSvg from "../../../assets/public/1.svg";
import twoSvg from "../../../assets/public/2.svg";
import threeSvg from "../../../assets/public/3.svg";
import { AccentButton } from "../../../components/AccentButton/AccentButton";

const COUNTDOWN_PACE = 600;
const OUT_MS = 140;
const VISIBLE_MS = Math.max(0, COUNTDOWN_PACE - OUT_MS);

type Props = {
  open: boolean;
  onCancel: () => void;
  onComplete: () => void;
  seconds?: 3 | 2 | 1;
};

const SVG_BY_COUNT: Record<number, string> = {
  1: oneSvg,
  2: twoSvg,
  3: threeSvg,
};

export function CountdownOverlay({
  open,
  onCancel,
  onComplete,
  seconds = 3,
}: Props) {
  const [displayCount, setDisplayCount] = useState<number>(seconds);
  const [phase, setPhase] = useState<"in" | "out">("in");

  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  const handleCancel = useCallback(() => {
    clearAllTimers();
    setPhase("in");
    setDisplayCount(seconds);
    onCancel();
  }, [clearAllTimers, onCancel, seconds]);

  useEffect(
    function handleLockScroll() {
      if (!open) return;

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = prev;
      };
    },
    [open],
  );

  useEffect(
    function registerEscapeToCancel() {
      if (!open) return;

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleCancel();
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    },
    [open, handleCancel],
  );

  useEffect(
    function handleCountdownSchedule() {
      if (!open) {
        clearAllTimers();
        return;
      }

      clearAllTimers();

      const startCount = seconds;

      schedule(() => {
        setPhase("in");
        setDisplayCount(startCount);
      }, 0);

      const counts = Array.from(
        { length: startCount },
        (_, i) => startCount - i,
      );

      counts.forEach((n) => {
        const base = (startCount - n) * COUNTDOWN_PACE;

        schedule(() => {
          setPhase("out");
        }, base + VISIBLE_MS);

        if (n > 1) {
          schedule(() => {
            setDisplayCount(n - 1);
            setPhase("in");
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
    },
    [open, seconds, onComplete, clearAllTimers, schedule],
  );

  if (!open) return null;

  const src = SVG_BY_COUNT[displayCount] ?? threeSvg;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Starting game"
    >
      <div className={styles.content}>
        <div className={styles.stage}>
          <img
            className={clsx(
              styles.countSvg,
              phase === "in" ? styles.in : styles.out,
            )}
            src={src}
            alt={`${displayCount}`}
          />
        </div>

        <div className={styles.actions}>
          <AccentButton variant="secondary" onClick={handleCancel}>
            Cancel
          </AccentButton>
        </div>
      </div>
    </div>
  );
}
