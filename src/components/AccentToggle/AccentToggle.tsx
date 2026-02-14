import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import styles from "./AccentToggle.module.scss";

type AccentToggleProps = {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  ariaLabel?: string;
  className?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "children" | "onClick"
>;

export function AccentToggle({
  checked,
  onChange,
  ariaLabel,
  className,
  disabled,
  type = "button",
  ...props
}: AccentToggleProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={clsx(styles.toggle, checked && styles.checked, className)}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      {...props}
    >
      <span className={styles.thumb} aria-hidden="true" />
    </button>
  );
}
