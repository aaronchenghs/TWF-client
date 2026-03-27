import clsx from "clsx";
import type { ReactNode } from "react";
import { startTransition, useEffect, useState } from "react";
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
        const frameId = window.requestAnimationFrame(() => {
          startTransition(() => {
            setQrCodeSrc(null);
          });
        });

        return () => {
          window.cancelAnimationFrame(frameId);
        };
      }

      let cancelled = false;
      let timeoutId: number | null = null;
      const frameId = window.requestAnimationFrame(() => {
        timeoutId = window.setTimeout(() => {
          import("qrcode")
            .then(({ default: QRCode }) =>
              QRCode.toDataURL(value, {
                margin: 1,
                width: 320,
                errorCorrectionLevel: "M",
              }),
            )
            .then((nextQrCodeSrc) => {
              if (cancelled) return;
              startTransition(() => {
                setQrCodeSrc(nextQrCodeSrc);
              });
            })
            .catch(() => {
              if (cancelled) return;
              startTransition(() => {
                setQrCodeSrc(null);
              });
            });
        }, 120);
      });

      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frameId);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
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
