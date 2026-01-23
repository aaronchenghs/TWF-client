import React from "react";
import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MaintTextTypography";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface AccentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Overrides accent color */
  color?: string;
}

export function AccentButton({
  variant = "primary",
  color,
  className,
  children,
  ...props
}: AccentButtonProps) {
  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      style={
        color
          ? ({ ["--accent" as string]: color } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <MainTextTypography variant="h4">{children}</MainTextTypography>
    </button>
  );
}
