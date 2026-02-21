import clsx from "clsx";
import styles from "./SubtextDivider.module.scss";

interface SubtextDividerProps {
  text: string;
  className?: string;
  noMargin?: boolean;
}

export function SubtextDivider({
  text,
  className,
  noMargin = false,
}: SubtextDividerProps) {
  return (
    <div className={clsx(styles.root, noMargin && styles.noMargin, className)}>
      <span className={styles.line} />
      <span className={styles.text}>{text}</span>
      <span className={styles.line} />
    </div>
  );
}
