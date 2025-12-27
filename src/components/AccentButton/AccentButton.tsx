import clsx from "clsx";
import styles from "./AccentButton.module.scss";
import { MainTextTypography } from "../MainTextTypography/MaintTextTypography";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface AccentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function AccentButton({
  variant = "primary",
  className,
  children,
  ...props
}: AccentButtonProps) {
  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      {...props}
    >
      <MainTextTypography variant="h5">{children}</MainTextTypography>
    </button>
  );
}
