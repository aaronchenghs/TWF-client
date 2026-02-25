import type { CSSProperties, ReactNode, Ref } from "react";
import clsx from "clsx";
import styles from "./GameStatusCard.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";

type GameStatusCardProps = {
  label?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  cardRef?: Ref<HTMLElement>;
};

export function GameStatusCard({
  label,
  headerRight,
  children,
  className,
  bodyClassName,
  style,
  cardRef,
}: GameStatusCardProps) {
  return (
    <section
      ref={cardRef}
      className={clsx(styles.card, className)}
      style={style}
    >
      <div className={styles.header}>
        {label && (
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            {label}
          </MainTextTypography>
        )}

        {headerRight && <div className={styles.headerRight}>{headerRight}</div>}
      </div>

      <div className={clsx(styles.body, bodyClassName)}>{children}</div>
    </section>
  );
}
