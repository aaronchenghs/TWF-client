import { useState } from "react";
import clsx from "clsx";
import styles from "./LoadableImage.module.scss";

type LoadableImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "onLoad" | "onError"
> & {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
};

export function LoadableImage({
  src,
  alt,
  className,
  fallback,
  onLoad,
  onError,
  fetchPriority,
  ...imgProps
}: LoadableImageProps) {
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const normalizedSrc = src ?? null;
  const isReady = !!normalizedSrc && readySrc === normalizedSrc;
  const hasFallback = !!fallback;

  if (!normalizedSrc && !hasFallback) return null;

  return (
    <div className={clsx(styles.root, className)}>
      {normalizedSrc && (
        <img
          key={normalizedSrc}
          className={clsx(styles.image, !isReady && styles.imageHidden)}
          src={normalizedSrc}
          alt={alt}
          {...imgProps}
          {...(fetchPriority
            ? ({ fetchpriority: fetchPriority } as Record<string, string>)
            : {})}
          onLoad={() => {
            setReadySrc(normalizedSrc);
            onLoad?.();
          }}
          onError={() => {
            setReadySrc(null);
            onError?.();
          }}
        />
      )}

      {hasFallback && (
        <div
          className={clsx(styles.fallback, isReady && styles.fallbackHidden)}
          aria-hidden="true"
        >
          {fallback}
        </div>
      )}

      {!hasFallback && normalizedSrc && !isReady && (
        <div className={styles.skeleton} aria-hidden="true" />
      )}
    </div>
  );
}
