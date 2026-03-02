import clsx from "clsx";
import styles from "./PrimaryModal.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { OverlayDialog } from "../OverlayDialog/OverlayDialog";

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

  const maxWidthStyle =
    typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  return (
    <OverlayDialog
      open={open}
      ariaLabel={ariaLabel ?? (typeof title === "string" ? title : "Modal")}
      onEscape={closeOnEscape ? onClose : undefined}
      onBackdrop={closeOnBackdrop ? onClose : undefined}
      usePortal
    >
      <div
        className={clsx(styles.modal, className)}
        style={{ maxWidth: maxWidthStyle }}
      >
        {(title || subtitle || showCloseButton) && (
          <header className={styles.header}>
            <div className={styles.headerText}>
              {title &&
                (typeof title === "string" ? (
                  <MainTextTypography variant="h3">{title}</MainTextTypography>
                ) : (
                  title
                ))}

              {subtitle &&
                (typeof subtitle === "string" ? (
                  <MainTextTypography
                    variant="caption"
                    muted
                    letterSpacing="wide"
                  >
                    {subtitle}
                  </MainTextTypography>
                ) : (
                  subtitle
                ))}
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

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </OverlayDialog>
  );
}
