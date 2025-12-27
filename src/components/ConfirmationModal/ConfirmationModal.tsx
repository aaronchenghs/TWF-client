import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MaintTextTypography";
import styles from "./ConfirmationModal.module.scss";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmationModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  confirmDisabled,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [isInternalWorking, setIsInternalWorking] = useState(false);
  const isMountedRef = useRef(true);

  const isWorking = confirmDisabled ?? isInternalWorking;

  const portalEl = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open || !portalEl) return null;

  const handleConfirm = async () => {
    if (isWorking) return;
    try {
      setIsInternalWorking(true);
      await onConfirm();
    } finally {
      if (isMountedRef.current) setIsInternalWorking(false);
    }
  };

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onCancel}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <MainTextTypography variant="h4" className={styles.title}>
            {title}
          </MainTextTypography>
        </div>

        {message ? (
          <MainTextTypography variant="body" muted className={styles.message}>
            {message}
          </MainTextTypography>
        ) : null}

        <div className={styles.actions}>
          <AccentButton
            variant="secondary"
            onClick={onCancel}
            disabled={isWorking}
          >
            Cancel
          </AccentButton>

          <AccentButton
            variant={destructive ? "destructive" : "primary"}
            onClick={handleConfirm}
            disabled={isWorking}
          >
            {confirmText}
          </AccentButton>
        </div>
      </div>
    </div>,
    portalEl
  );
}
