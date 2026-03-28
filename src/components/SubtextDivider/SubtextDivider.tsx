import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./SubtextDivider.module.scss";

interface SubtextDividerProps {
  text?: string;
  className?: string;
  noMargin?: boolean;
  textTone?: "default" | "player";
}

export function SubtextDivider({
  text,
  className,
  noMargin = false,
  textTone = "default",
}: SubtextDividerProps) {
  const normalizedText = text?.trim() ?? "";
  const rootClassName = clsx(
    styles.root,
    noMargin && styles.noMargin,
    textTone === "player" && styles.rootPlayer,
    className,
  );

  if (!normalizedText) {
    return (
      <div className={rootClassName}>
        <span className={styles.line} />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
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
