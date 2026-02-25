import type { ReactNode } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./SettingsOptionRow.module.scss";
import clsx from "clsx";

type SettingsOptionRowProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  control?: ReactNode;
  layout?: "inline" | "stacked";
};

export function SettingsOptionRow({
  icon,
  title,
  description,
  control,
  layout = "inline",
}: SettingsOptionRowProps) {
  return (
    <section
      className={clsx(
        styles.settingRow,
        layout === "stacked" && styles.layoutStacked,
      )}
    >
      <div className={styles.settingInfo}>
        <div className={styles.titleRow}>
          {icon && (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          )}
          <MainTextTypography variant="h5">{title}</MainTextTypography>
        </div>
        {description && (
          <MainTextTypography variant="caption" muted>
            {description}
          </MainTextTypography>
        )}
      </div>

      {control && <div className={styles.control}>{control}</div>}
    </section>
  );
}
