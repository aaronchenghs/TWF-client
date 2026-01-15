import { useEffect, useRef, useState } from "react";
import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MaintTextTypography";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";

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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleConfirm = async () => {
    if (isWorking) return;
    try {
      setIsInternalWorking(true);
      await onConfirm();
    } finally {
      if (isMountedRef.current) setIsInternalWorking(false);
    }
  };

  return (
    <PrimaryModal
      open={open}
      onClose={onCancel}
      title={title}
      ariaLabel={title}
      maxWidth={520}
      closeOnBackdrop
      closeOnEscape
      showCloseButton
      footer={
        <>
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
        </>
      }
    >
      {message ? (
        <MainTextTypography variant="body" muted>
          {message}
        </MainTextTypography>
      ) : null}
    </PrimaryModal>
  );
}
