import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import styles from "./ExpandingIconButton.module.scss";

type ExpandDirection = "left" | "right";

type ExpandingIconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  expandDirection?: ExpandDirection;
  className?: string;
  ariaLabel?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export function ExpandingIconButton({
  icon,
  label,
  onClick,
  expandDirection = "right",
  className,
  ariaLabel,
  type = "button",
  ...buttonProps
}: ExpandingIconButtonProps) {
  const dynamicStyle = {
    "--label-length": Math.max(label.trim().length, 4),
  } as CSSProperties;

  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        expandDirection === "left" ? styles.expandLeft : styles.expandRight,
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      style={dynamicStyle}
      {...buttonProps}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
