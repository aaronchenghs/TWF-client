import clsx from "clsx";
import styles from "./AccentTextInput.module.scss";
import { forwardRef, type CSSProperties } from "react";
import {
  APP_ICONS,
  ICON_PROPS,
  type AppIconValue,
} from "@/lib/constants/icons";

type AccentTextInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "width"
> & {
  width?: CSSProperties["width"];
  fullWidth?: boolean;
  icon?: AppIconValue<typeof APP_ICONS>;
};

export const AccentTextInput = forwardRef<
  HTMLInputElement,
  AccentTextInputProps
>(function AccentTextInput(
  {
    className,
    width,
    fullWidth,
    style,
    icon: Icon,
    ...props
  }: AccentTextInputProps,
  ref,
) {
  const { width: styleWidth, ...inputStyle } = style ?? {};
  const resolvedWidth = fullWidth ? "100%" : (width ?? styleWidth ?? "120px");
  const ariaLabel =
    props["aria-label"] ??
    (props["aria-labelledby"] ? undefined : (props.placeholder ?? props.name));

  return (
    <div className={styles.wrapper} style={{ width: resolvedWidth }}>
      <input
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        className={clsx(styles.input, Icon && styles.hasIcon, className)}
        style={inputStyle}
      />
      {Icon ? (
        <span className={styles.icon} aria-hidden="true">
          <Icon {...ICON_PROPS.accentTextInput} />
        </span>
      ) : null}
    </div>
  );
});
