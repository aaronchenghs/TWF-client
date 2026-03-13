import React from "react";
import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { useMobileView } from "@/lib/hooks/useMobileView";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "special";
type Size = "small";

interface AccentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Overrides accent color */
  color?: string;
  /** Applies selected/inverted visual treatment. */
  selected?: boolean;
}

export function AccentButton({
  variant = "primary",
  size,
  color,
  selected = false,
  className,
  type = "button",
  children,
  ...props
}: AccentButtonProps) {
  const isMobile = useMobileView();
  const labelVariant =
    size === "small" ? (isMobile ? "h5" : "h6") : isMobile ? "h2" : "h3";
  const shouldWrapLabel =
    typeof children === "string" || typeof children === "number";

  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        selected && styles.selected,
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
      {shouldWrapLabel ? (
        <MainTextTypography variant={labelVariant}>{children}</MainTextTypography>
      ) : (
        children
      )}
    </button>
  );
}
