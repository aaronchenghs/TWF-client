import { useState } from "react";
import clsx from "clsx";
import styles from "./LoadableImage.module.scss";

type LoadableImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "onLoad" | "onError" | "fetchPriority"
> & {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  fetchPriority?: "high" | "low" | "auto";
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

  if (!normalizedSrc) return fallback ? <>{fallback}</> : null;

  return (
    <div className={clsx(styles.root, className)}>
      <img
        key={normalizedSrc ?? "no-src"}
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

      {!isReady && <div className={styles.skeleton} aria-hidden="true" />}
    </div>
  );
}
