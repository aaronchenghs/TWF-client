import styles from "./SliderControl.module.scss";
import { isSliderCommitKey } from "@/lib/accessibility";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

type SliderControlProps = {
  valuePercent: number;
  ariaLabel: string;
  onChangePercent: (nextPercent: number) => void;
  onCommit?: () => void;
  disabled?: boolean;
};

export function SliderControl({
  valuePercent,
  ariaLabel,
  onChangePercent,
  onCommit,
  disabled,
}: SliderControlProps) {
  const clamped = clampPercent(Math.round(valuePercent));

  return (
    <div className={styles.root}>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={100}
        step={1}
        value={clamped}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(e) => onChangePercent(clampPercent(Number(e.target.value)))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={(e) => {
          if (!isSliderCommitKey(e.key)) return;
          onCommit?.();
        }}
      />
      <span className={styles.value} aria-hidden="true">
        {clamped}%
      </span>
    </div>
  );
}
