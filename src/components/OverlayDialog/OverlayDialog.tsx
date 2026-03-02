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
    <div
      className={clsx(styles.overlay, className)}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        if (!onBackdrop) return;
        if (e.target === e.currentTarget) onBackdrop();
      }}
    >
      <div className={clsx(styles.content, contentClassName)}>{children}</div>
    </div>
  );

  if (usePortal) return createPortal(content, document.body);

  return content;
}
