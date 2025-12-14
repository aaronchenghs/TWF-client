import clsx from "clsx";
import styles from "./AccentTextInput.module.scss";

type AccentTextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function AccentTextInput({ className, ...props }: AccentTextInputProps) {
  return <input className={clsx(styles.input, className)} {...props} />;
}
