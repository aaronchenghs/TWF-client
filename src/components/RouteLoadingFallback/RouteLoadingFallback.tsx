import styles from "./RouteLoadingFallback.module.scss";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";

export function RouteLoadingFallback() {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.panel}>
        <TWFLogo className={styles.logo} aria-hidden="true" />

        <div className={styles.row}>
          <MainTextTypography variant="body" className={styles.subtitle} muted>
            Setting up your session
            <AnimatedDots />
          </MainTextTypography>
        </div>
      </div>
    </div>
  );
}
