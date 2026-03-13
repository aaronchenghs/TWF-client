import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./ExpandingIconButton.module.scss";

type ExpandDirection = "left" | "right";
type Variant = "normal" | "destructive";

type ExpandingIconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  expandDirection?: ExpandDirection;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export function ExpandingIconButton({
  icon,
  label,
  onClick,
  expandDirection = "right",
  variant = "normal",
  className,
  ariaLabel,
  type = "button",
  ...buttonProps
}: ExpandingIconButtonProps) {
  const [labelWidthPx, setLabelWidthPx] = useState(0);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const dynamicStyle = {
    "--label-length": Math.max(label.trim().length, 4),
    "--label-width-px": `${labelWidthPx}px`,
  } as CSSProperties;

  useLayoutEffect(
    function measureLabelWidth() {
      const labelElement = labelRef.current;
      if (!labelElement) return;

      const measure = () => {
        setLabelWidthPx(Math.ceil(labelElement.scrollWidth));
      };

      measure();

      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => measure());
      observer.observe(labelElement);
      return () => observer.disconnect();
    },
    [label],
  );

  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        expandDirection === "left" ? styles.expandLeft : styles.expandRight,
        variant === "destructive" && styles.destructive,
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
      <span ref={labelRef} className={styles.label} aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
