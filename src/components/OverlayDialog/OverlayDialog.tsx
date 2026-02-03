import { useEffect } from "react";
import clsx from "clsx";
import styles from "./OverlayDialog.module.scss";
import { handleKeyDown } from "../../lib/accessibility";

type Props = {
  open: boolean;
  ariaLabel: string;
  onEscape?: () => void;
  lockScroll?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function OverlayDialog({
  open,
  ariaLabel,
  onEscape,
  lockScroll = true,
  className,
  children,
}: Props) {
  useEffect(
    function handleLockScroll() {
      if (!open || !lockScroll) return;

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    },
    [open, lockScroll],
  );

  useEffect(
    function registerEscapeToCancel() {
      if (!open || !onEscape) return;

      const onKeyDown = (e: KeyboardEvent) => {
        handleKeyDown(e, () => onEscape());
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    },
    [open, onEscape],
  );

  if (!open) return null;

  return (
    <div
      className={clsx(styles.overlay, className)}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
}
