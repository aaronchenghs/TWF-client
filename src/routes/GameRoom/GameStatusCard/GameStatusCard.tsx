import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./GameStatusCard.module.scss";
import { MainTextTypography } from "../../../components/MainTextTypography/MainTextTypography";

type GameStatusCardProps = {
  label: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function GameStatusCard({
  label,
  headerRight,
  children,
  className,
  bodyClassName,
}: GameStatusCardProps) {
  return (
    <section className={clsx(styles.card, className)}>
      <div className={styles.header}>
        <MainTextTypography variant="label" muted letterSpacing="wide">
          {label}
        </MainTextTypography>

        {headerRight ? (
          <div className={styles.headerRight}>{headerRight}</div>
        ) : null}
      </div>

      <div className={clsx(styles.body, bodyClassName)}>{children}</div>
    </section>
  );
}
