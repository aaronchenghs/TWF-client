import clsx from "clsx";
import styles from "../Controls.module.scss";

export function AwaitingControls() {
  return (
    <div
      className={clsx(styles.controls, styles.awaiting)}
      aria-hidden="true"
    />
  );
}
