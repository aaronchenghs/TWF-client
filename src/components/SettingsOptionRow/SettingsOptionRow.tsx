import type { ReactNode } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./SettingsOptionRow.module.scss";

type SettingsOptionRowProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  control?: ReactNode;
};

export function SettingsOptionRow({
  icon,
  title,
  description,
  control,
}: SettingsOptionRowProps) {
  return (
    <section className={styles.settingRow}>
      <div className={styles.settingInfo}>
        <div className={styles.titleRow}>
          {icon ? (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <MainTextTypography variant="h5">{title}</MainTextTypography>
        </div>
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
