import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import styles from "./OverlayDialog.module.scss";
import { handleKeyDown } from "../../lib/accessibility";

type Props = {
  open: boolean;
  ariaLabel: string;
  onEscape?: () => void;
  onBackdrop?: () => void;
  lockScroll?: boolean;
  usePortal?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export function OverlayDialog({
  open,
  ariaLabel,
  onEscape,
  onBackdrop,
  lockScroll = true,
  usePortal = false,
  className,
  contentClassName,
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
        handleKeyDown(e, () => onEscape(), { keys: ["Escape"] });
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    },
    [open, onEscape],
  );

  if (!open) return null;

  const content = (
    <div className={clsx(styles.overlay, className)}>
      {onBackdrop && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close dialog"
          tabIndex={-1}
          onClick={onBackdrop}
        />
      )}
      <div
        className={clsx(styles.content, contentClassName)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );

  if (usePortal) return createPortal(content, document.body);

  return content;
}
