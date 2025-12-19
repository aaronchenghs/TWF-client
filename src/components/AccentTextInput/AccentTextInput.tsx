import clsx from "clsx";
import styles from "./AccentTextInput.module.scss";
import type { CSSProperties } from "react";

type AccentTextInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "width"
> & {
  width?: CSSProperties["width"];
  fullWidth?: boolean;
};

export function AccentTextInput({
  className,
  width,
  fullWidth,
  style,
  ...props
}: AccentTextInputProps) {
  const resolvedWidth = fullWidth ? "100%" : width ?? "120px";
  return (
    <input
      {...props}
      className={clsx(styles.input, className)}
      style={{ ...style, width: resolvedWidth }}
    />
  );
}
