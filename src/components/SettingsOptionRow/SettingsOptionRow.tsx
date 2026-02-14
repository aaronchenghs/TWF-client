import type { ReactNode } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./SettingsOptionRow.module.scss";

type SettingsOptionRowProps = {
  title: string;
  description?: string;
  control?: ReactNode;
};

export function SettingsOptionRow({
  title,
  description,
  control,
}: SettingsOptionRowProps) {
  return (
    <section className={styles.settingRow}>
      <div className={styles.settingInfo}>
        <MainTextTypography variant="h5">{title}</MainTextTypography>
        {description ? (
          <MainTextTypography variant="caption" muted>
            {description}
          </MainTextTypography>
        ) : null}
      </div>

      {control ? <div className={styles.control}>{control}</div> : null}
    </section>
  );
}
