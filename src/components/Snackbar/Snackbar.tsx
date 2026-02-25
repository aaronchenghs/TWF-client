import { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import styles from "./Snackbar.module.scss";
import {
  useAppDispatch,
  useAppSelector,
  type AppState,
} from "../../store/store";
import type { SnackbarItem } from "../../store/slices/snackBarSlice";
import { dismissSnackbar } from "../../store/slices/snackBarSlice";
import type { Guid } from "../../lib/guid";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";

export function SnackbarHost() {
  const $items = useAppSelector((state: AppState) => state.snackbar.items);
  const dispatch = useAppDispatch();

  const handleDismiss = useCallback(
    (id: Guid) => {
      dispatch(dismissSnackbar(id));
    },
    [dispatch],
  );

  return (
    <div
      className={styles.host}
      aria-live="assertive"
      aria-relevant="additions removals"
    >
      {$items.map((item) => (
        <SnackbarCard key={item.id} item={item} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

function SnackbarCard(props: {
  item: SnackbarItem;
  onDismiss: (id: Guid) => void;
}) {
  const { item, onDismiss } = props;

  const [isPaused, setPaused] = useState(false);

  const remainingMsRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const dismissedRef = useRef(false);

  const clearDismissTimeout = useCallback(() => {
    if (timeoutRef.current === null) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearDismissTimeout();
    if (remainingMsRef.current <= 0) {
      dismissedRef.current = true;
      onDismiss(item.id);
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      dismissedRef.current = true;
      onDismiss(item.id);
    }, remainingMsRef.current);
  }, [clearDismissTimeout, item.id, onDismiss]);

  useEffect(
    function initializeSnackbarTimer() {
      dismissedRef.current = false;
      pauseStartRef.current = null;
      clearDismissTimeout();

      if (item.durationMs === null) return;

      remainingMsRef.current = item.durationMs;
      if (!isPaused) scheduleDismiss();

      return () => {
        clearDismissTimeout();
      };
    },
    // Intentionally exclude isPaused: this effect initializes per item,
    // while pause/resume adjustments are handled in syncPausedState below.
    [item.id, item.durationMs, clearDismissTimeout, scheduleDismiss],
  );

  useEffect(
    function syncPausedState() {
      if (item.durationMs === null || dismissedRef.current) return;

      if (isPaused) {
        pauseStartRef.current = Date.now();
        clearDismissTimeout();
        return;
      }

      if (pauseStartRef.current !== null) {
        const pausedMs = Date.now() - pauseStartRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - pausedMs);
        pauseStartRef.current = null;
      }

      scheduleDismiss();
    },
    [isPaused, item.durationMs, clearDismissTimeout, scheduleDismiss],
  );

  return (
    <div
      className={clsx(styles.card, styles[`sev_${item.severity}`])}
      role="alert"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.content}>
        {item.title && (
          <MainTextTypography variant="h4">{item.title}</MainTextTypography>
        )}
        <div className={styles.message}>{item.message}</div>
      </div>

      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
      >
        ×
      </button>
    </div>
  );
}
