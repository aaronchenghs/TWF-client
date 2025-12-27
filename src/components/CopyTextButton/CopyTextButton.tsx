import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Copy, Check } from "lucide-react";
import styles from "./CopyTextButton.module.scss";

const DEFAULT_COPIED_MS = 900;

type CopyTextButtonProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  title?: string;
};

export function CopyTextButton({
  value,
  disabled,
  className,
  title = "Copy",
}: CopyTextButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isDisabled = disabled || !value;

  const handleCopy = useCallback(async () => {
    if (!value) return false;

    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = value;
        el.style.position = "fixed";
        el.style.left = "-9999px";
        el.style.top = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        return ok;
      } catch {
        return false;
      }
    }
  }, [value]);

  const onClick = useCallback(async () => {
    if (disabled) return;
    const ok = await handleCopy();
    if (!ok) return;

    setIsCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => setIsCopied(false),
      DEFAULT_COPIED_MS
    );
  }, [disabled, handleCopy]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={clsx(styles.button, isCopied && styles.copied, className)}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={"Copy text button"}
      title={isCopied ? "Copied" : title}
    >
      {isCopied ? (
        <Check className={styles.icon} aria-hidden="true" />
      ) : (
        <Copy className={styles.icon} aria-hidden="true" />
      )}
    </button>
  );
}
