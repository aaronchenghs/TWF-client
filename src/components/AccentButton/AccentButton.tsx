import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MaintTextTypography";

type Variant = "primary" | "secondary" | "ghost";

interface AccentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function AccentButton({
  variant = "primary",
  className,
  ...props
}: AccentButtonProps) {
  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      {...props}
    >
      <MainTextTypography>{props.children}</MainTextTypography>
    </button>
  );
}
