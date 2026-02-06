import styles from "./RouteLoadingFallback.module.scss";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";

export function RouteLoadingFallback() {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.panel}>
        <TWFLogo className={styles.logo} aria-hidden="true" />

        <MainTextTypography variant="h4" className={styles.title}>
          Loading
        </MainTextTypography>

        <div className={styles.row}>
          <div className={styles.spinner} aria-hidden="true" />
          <MainTextTypography
            variant="caption"
            className={styles.subtitle}
            muted
          >
            Setting up your session
            <AnimatedDots />
          </MainTextTypography>
        </div>

        <div className={styles.bar} aria-hidden="true">
          <div className={styles.barFill} />
        </div>
      </div>
    </div>
  );
}
