import clsx from "clsx";
import styles from "./SubtextDivider.module.scss";

interface SubtextDividerProps {
  text: string;
  className?: string;
}

export function SubtextDivider({ text, className }: SubtextDividerProps) {
  return (
    <div className={clsx(styles.root, className)}>
      <span className={styles.line} />
      <span className={styles.text}>{text}</span>
      <span className={styles.line} />
    </div>
  );
}
