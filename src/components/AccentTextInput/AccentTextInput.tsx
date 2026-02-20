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
  const resolvedWidth = fullWidth ? "100%" : (width ?? "120px");
  const ariaLabel =
    props["aria-label"] ??
    (props["aria-labelledby"] ? undefined : (props.placeholder ?? props.name));

  return (
    <input
      {...props}
      aria-label={ariaLabel}
      className={clsx(styles.input, className)}
      style={{ ...style, width: resolvedWidth }}
    />
  );
}
