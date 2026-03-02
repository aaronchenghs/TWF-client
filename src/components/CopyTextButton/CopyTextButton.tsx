import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./CopyTextButton.module.scss";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { copyTextToClipboard } from "@/lib/clipboard";

const DEFAULT_COPIED_MS = 900;
const { copy: CopyIcon, copied: CopiedIcon } = APP_ICONS;

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
  const iconProps = ICON_PROPS.copyButton;
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isDisabled = disabled || !value;

  const onClick = useCallback(async () => {
    if (disabled) return;
    const ok = await copyTextToClipboard(value);
    if (!ok) return;

    setIsCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => setIsCopied(false),
      DEFAULT_COPIED_MS,
    );
  }, [disabled, value]);

  useEffect(function cleanupCopyTimer() {
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
        <CopiedIcon className={styles.icon} {...iconProps} aria-hidden="true" />
      ) : (
        <CopyIcon className={styles.icon} {...iconProps} aria-hidden="true" />
      )}
    </button>
  );
}
