import styles from "./SliderControl.module.scss";
import { isSliderCommitKey } from "@/lib/accessibility";
import { clamp } from "@/lib/clamp";

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
  const clamped = clamp(Math.round(valuePercent), 0, 100);

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
        onChange={(e) => onChangePercent(clamp(Number(e.target.value), 0, 100))}
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
