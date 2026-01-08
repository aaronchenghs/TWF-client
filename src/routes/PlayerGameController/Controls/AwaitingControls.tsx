import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import styles from "./Controls.module.scss";

export function AwaitingControls() {
  return (
    <div className={styles.controls}>
      <MainTextTypography
        variant="label"
        muted
        letterSpacing="wide"
        className={styles.controlsLabel}
      >
        STATUS
      </MainTextTypography>
      <MainTextTypography variant="body" muted className={styles.smallNote}>
        Waiting…
      </MainTextTypography>
    </div>
  );
}
