import { useEffect, useLayoutEffect, useRef, type SyntheticEvent } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  useLayoutEffect(
    function showNativeModalDialog() {
      if (!open || !usePortal) return;

      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;

      dialog.showModal();

      return () => {
        if (!dialog.open) return;

        dialog.close();
      };
    },
    [open, usePortal],
  );

  if (!open) return null;

  function handleNativeCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onEscape?.();
  }

  const overlayContent = (
    <>
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
        role={usePortal ? undefined : "dialog"}
        aria-modal={usePortal ? undefined : true}
        aria-label={usePortal ? undefined : ariaLabel}
      >
        {children}
      </div>
    </>
  );

  const content = usePortal ? (
    <dialog
      ref={dialogRef}
      className={clsx(styles.overlay, className)}
      aria-modal="true"
      aria-label={ariaLabel}
      onCancel={handleNativeCancel}
    >
      {overlayContent}
    </dialog>
  ) : (
    <div className={clsx(styles.overlay, className)}>{overlayContent}</div>
  );

  if (usePortal) return createPortal(content, document.body);

  return content;
}
