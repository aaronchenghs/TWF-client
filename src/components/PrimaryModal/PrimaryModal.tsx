import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import styles from "./PrimaryModal.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";

export function PrimaryModal(props: {
  open: boolean;
  onClose: () => void;

  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;

  children: React.ReactNode;
  footer?: React.ReactNode;

  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;

  maxWidth?: number | string;
  className?: string;
  contentClassName?: string;

  ariaLabel?: string;
}) {
  const {
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    maxWidth = 920,
    className,
    contentClassName,
    ariaLabel,
  } = props;

  useEffect(
    function handleLockScroll() {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    },
    [open],
  );

  useEffect(
    function handleKeyBoard() {
      if (!open || !closeOnEscape) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    },
    [open, closeOnEscape, onClose],
  );

  if (!open) return null;

  const maxWidthStyle =
    typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  const content = (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === "string" ? title : "Modal")}
      onMouseDown={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(styles.modal, className)}
        style={{ maxWidth: maxWidthStyle }}
      >
        {(title || subtitle || showCloseButton) && (
          <header className={styles.header}>
            <div className={styles.headerText}>
              {title ? (
                typeof title === "string" ? (
                  <MainTextTypography variant="h3">{title}</MainTextTypography>
                ) : (
                  title
                )
              ) : null}

              {subtitle ? (
                typeof subtitle === "string" ? (
                  <MainTextTypography
                    variant="caption"
                    muted
                    letterSpacing="wide"
                  >
                    {subtitle}
                  </MainTextTypography>
                ) : (
                  subtitle
                )
              ) : null}
            </div>

            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                X
              </button>
            )}
          </header>
        )}

        <div className={clsx(styles.content, contentClassName)}>{children}</div>

        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
