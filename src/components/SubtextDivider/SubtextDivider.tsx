import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./SubtextDivider.module.scss";

interface SubtextDividerProps {
  text?: string;
  className?: string;
  noMargin?: boolean;
}

export function SubtextDivider({
  text,
  className,
  noMargin = false,
}: SubtextDividerProps) {
  const normalizedText = text?.trim() ?? "";

  if (!normalizedText) {
    return (
      <div
        className={clsx(styles.root, noMargin && styles.noMargin, className)}
      >
        <span className={styles.line} />
      </div>
    );
  }

  return (
    <div className={clsx(styles.root, noMargin && styles.noMargin, className)}>
      <span className={styles.line} />
      <MainTextTypography
        variant="label"
        letterSpacing="normal"
        className={styles.text}
      >
        {normalizedText}
      </MainTextTypography>
      <span className={styles.line} />
    </div>
  );
}
