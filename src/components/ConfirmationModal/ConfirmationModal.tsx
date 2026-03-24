import { useEffect, useRef, useState } from "react";
import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";
import styles from "./ConfirmationModal.module.scss";

type ConfirmationAction = {
  text: string;
  onAction: () => void | Promise<void>;
};

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmAction: ConfirmationAction;
  secondaryAction?: ConfirmationAction;
  confirmDisabled?: boolean;
  destructive?: boolean;
  maxWidth?: number | string;
  onCancel: () => void;
};

export function ConfirmationModal({
  open,
  title,
  message,
  confirmAction,
  secondaryAction,
  confirmDisabled,
  destructive,
  maxWidth,
  onCancel,
}: ConfirmationModalProps) {
  const [isInternalWorking, setIsInternalWorking] = useState(false);
  const isMountedRef = useRef(true);

  const isWorking = confirmDisabled ?? isInternalWorking;

  const runAction = async (action: () => void | Promise<void>) => {
    if (isWorking) return;
    try {
      setIsInternalWorking(true);
      await action();
    } finally {
      if (isMountedRef.current) setIsInternalWorking(false);
    }
  };

  const handleConfirm = async () => {
    await runAction(confirmAction.onAction);
  };

  const handleSecondaryAction = async () => {
    if (!secondaryAction) return;
    await runAction(secondaryAction.onAction);
  };

  useEffect(function trackMountedState() {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <PrimaryModal
      open={open}
      onClose={onCancel}
      title={title}
      ariaLabel={title}
      maxWidth={maxWidth ?? 520}
      closeOnBackdrop
      closeOnEscape
      showCloseButton
      footer={
        <div className={styles.actions}>
          <AccentButton
            variant="secondary"
            className={styles.actionButton}
            onClick={onCancel}
            disabled={isWorking}
          >
            Cancel
          </AccentButton>

          {secondaryAction && (
            <AccentButton
              variant="secondary"
              className={styles.actionButton}
              onClick={handleSecondaryAction}
              disabled={isWorking}
            >
              {secondaryAction.text}
            </AccentButton>
          )}

          <AccentButton
            variant={destructive ? "destructive" : "primary"}
            className={styles.actionButton}
            onClick={handleConfirm}
            disabled={isWorking}
          >
            {confirmAction.text}
          </AccentButton>
        </div>
      }
    >
      {message && (
        <MainTextTypography variant="body" muted>
          {message}
        </MainTextTypography>
      )}
    </PrimaryModal>
  );
}
