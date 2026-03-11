import type { CSSProperties } from "react";
import clsx from "clsx";
import styles from "./ProgressBar.module.scss";

type ProgressBarProps = {
  value: number;
  max: number;
  min?: number;
  ariaLabel: string;
  ariaValueText?: string;
  className?: string;
  fillClassName?: string;
  style?: CSSProperties;
};

export function ProgressBar({
  value,
  max,
  min = 0,
  ariaLabel,
  ariaValueText,
  className,
  fillClassName,
  style,
}: ProgressBarProps) {
  const clampedMax = Math.max(max, 0);
  const clampedValue = Math.min(clampedMax, Math.max(0, value));
  const ariaMax = Math.max(clampedMax, min);
  const ariaNow = Math.min(ariaMax, Math.max(min, value));
  const progressPercent =
    clampedMax === 0
      ? 0
      : Math.min(100, Math.max(0, (clampedValue / clampedMax) * 100));

  return (
    <div
      className={clsx(styles.track, className)}
      style={style}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={ariaMax}
      aria-valuenow={ariaNow}
      aria-valuetext={ariaValueText}
    >
      <div
        className={clsx(styles.fill, fillClassName)}
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  );
}
