import React from "react";
import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { useMobileView } from "@/lib/hooks/useMobileView";

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
  type = "button",
  children,
  ...props
}: AccentButtonProps) {
  const isMobile = useMobileView();
  const labelVariant =
    size === "small" ? (isMobile ? "h5" : "h6") : isMobile ? "h2" : "h3";

  return (
    <button
      type={type}
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
      <MainTextTypography variant={labelVariant}>{children}</MainTextTypography>
    </button>
  );
}
