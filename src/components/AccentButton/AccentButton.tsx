import React from "react";
import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "small";

interface AccentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Overrides accent color */
  color?: string;
}

export function AccentButton({
  variant = "primary",
  size,
  color,
  className,
  children,
  ...props
}: AccentButtonProps) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        size && styles[size],
        className,
      )}
      style={
        color
          ? ({ ["--accent" as string]: color } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <MainTextTypography variant={size === "small" ? "h6" : "h4"}>
        {children}
      </MainTextTypography>
    </button>
  );
}
