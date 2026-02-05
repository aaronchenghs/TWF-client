import clsx from "clsx";
import styles from "./AnimatedDots.module.scss";

type AnimatedDotsProps = {
  className?: string;
};

export function AnimatedDots({ className }: AnimatedDotsProps) {
  return <span className={clsx(styles.dots, className)} aria-hidden="true" />;
}
