import { useMemo, useState } from "react";
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
  ...imgProps
}: LoadableImageProps) {
  const [readySrc, setReadySrc] = useState<string | null>(null);

  const normalizedSrc = src ?? null;
  const isReady = !!normalizedSrc && readySrc === normalizedSrc;

  const key = useMemo(() => normalizedSrc ?? "no-src", [normalizedSrc]);

  if (!normalizedSrc) return fallback ? <>{fallback}</> : null;

  return (
    <div className={clsx(styles.root, className)}>
      <img
        key={key}
        className={clsx(styles.image, !isReady && styles.imageHidden)}
        src={normalizedSrc}
        alt={alt}
        {...imgProps}
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
