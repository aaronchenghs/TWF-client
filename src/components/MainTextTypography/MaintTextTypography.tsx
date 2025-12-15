import clsx from "clsx";
import styles from "./MainTextTypography.module.scss";

type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption";

interface MainTextTypographyProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  muted?: boolean;
}

export function MainTextTypography({
  variant = "body",
  className,
  children,
  muted,
}: MainTextTypographyProps) {
  return (
    <span
      className={clsx(
        styles.text,
        styles[variant],
        muted && styles.muted,
        className
      )}
    >
      {children}
    </span>
  );
}
