import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./Pill.module.scss";

type PillSize = "sm" | "md" | "lg";
type PillShape = "round" | "soft";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  size?: PillSize;
  shape?: PillShape;
};

export function Pill({
  size = "md",
  shape = "round",
  className,
  children,
  ...props
}: PillProps) {
  return (
    <span
      className={clsx(
        styles.pill,
        styles[`size_${size}`],
        styles[`shape_${shape}`],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
