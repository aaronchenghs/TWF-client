import React from "react";
import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { useMemo } from "react";
import { useMobileView } from "@/lib/hooks/useMobileView";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "special";
type LabelVariant = "h2" | "h3" | "h5" | "h6";
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

  const labelVariant = useMemo<LabelVariant>(() => {
    if (size === "small") {
      return isMobile ? "h5" : "h6";
    }
    return isMobile ? "h2" : "h3";
  }, [isMobile, size]);

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
        color ? ({ ["--accent"]: color } as React.CSSProperties) : undefined
      }
      {...props}
    >
      {shouldWrapLabel ? (
        <MainTextTypography variant={labelVariant}>
          {children}
        </MainTextTypography>
      ) : (
        children
      )}
    </button>
  );
}
