import clsx from "clsx";
import type { CSSProperties } from "react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { clampPositiveInteger } from "@/lib/clamp";
import styles from "./GroupedButtonOptions.module.scss";

type GroupedButtonOption<TValue extends string | number | null> = {
  value: TValue;
  label: string;
  detail?: string;
  ariaLabel: string;
  labelStyle?: "default" | "symbol";
};

type GroupedButtonOptionsProps<TValue extends string | number | null> = {
  ariaLabel: string;
  options: readonly GroupedButtonOption<TValue>[];
  value: TValue;
  onChange: (nextValue: TValue) => void;
  className?: string;
  columns?: number;
  mobileColumns?: number;
};

export function GroupedButtonOptions<TValue extends string | number | null>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
  columns,
  mobileColumns,
}: GroupedButtonOptionsProps<TValue>) {
  const columnCount = clampPositiveInteger(columns ?? options.length, 1);
  const mobileColumnCount = clampPositiveInteger(
    mobileColumns ?? Math.min(2, columnCount),
    1,
  );

  return (
    <div
      className={clsx(styles.group, className)}
      role="group"
      aria-label={ariaLabel}
      style={
        {
          ["--grouped-button-columns" as string]: columnCount,
          ["--grouped-button-mobile-columns" as string]: mobileColumnCount,
        } as CSSProperties
      }
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <AccentButton
            key={`${String(option.value)}-${option.label}`}
            variant="secondary"
            size="small"
            selected={isSelected}
            onClick={() => onChange(option.value)}
            className={styles.button}
            aria-pressed={isSelected}
            aria-label={option.ariaLabel}
          >
            <span className={styles.buttonContent}>
              <MainTextTypography
                variant={"body"}
                weight={"bold"}
                textAlign="center"
                className={styles.labelText}
              >
                {option.label}
              </MainTextTypography>
              {option.detail && (
                <MainTextTypography
                  variant="caption"
                  muted
                  textAlign="center"
                  className={styles.detailText}
                >
                  {option.detail}
                </MainTextTypography>
              )}
            </span>
          </AccentButton>
        );
      })}
    </div>
  );
}
