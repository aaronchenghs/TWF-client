import clsx from "clsx";
import type { ReactNode } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./QrCodeDisplay.module.scss";

type QrCodeDisplayProps = {
  value: string;
  alt?: string;
  className?: string;
  loadingTitle?: string;
  loadingCaption?: ReactNode;
};

export function QrCodeDisplay({
  value,
  alt,
  className,
  loadingTitle = "Preparing QR Code",
  loadingCaption,
}: QrCodeDisplayProps) {
  const [qrCodeSrc, setQrCodeSrc] = useState<string | null>(null);

  useEffect(
    function generateQrCode() {
      if (!value) {
        setQrCodeSrc(null);
        return;
      }

      let cancelled = false;

      QRCode.toDataURL(value, {
        margin: 1,
        width: 320,
        errorCorrectionLevel: "M",
      })
        .then((nextQrCodeSrc) => {
          if (!cancelled) setQrCodeSrc(nextQrCodeSrc);
        })
        .catch(() => {
          if (!cancelled) setQrCodeSrc(null);
        });

      return () => {
        cancelled = true;
      };
    },
    [value],
  );

  return (
    <div className={clsx(styles.root, className)}>
      {qrCodeSrc ? (
        <img
          className={styles.image}
          src={qrCodeSrc}
          alt={alt ?? `QR code for ${value}`}
        />
      ) : (
        <div className={styles.fallback}>
          <MainTextTypography
            variant="body"
            weight="bold"
            textAlign="center"
            letterSpacing="wide"
          >
            {loadingTitle}
          </MainTextTypography>
          {loadingCaption ? (
            <MainTextTypography
              variant="caption"
              textAlign="center"
              className={styles.fallbackCaption}
            >
              {loadingCaption}
            </MainTextTypography>
          ) : null}
        </div>
      )}
    </div>
  );
}
