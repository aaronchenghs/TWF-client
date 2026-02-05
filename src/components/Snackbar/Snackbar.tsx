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

export function SnackbarHost() {
  const items = useAppSelector((state: AppState) => state.snackbar.items);
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
      {items.map((item) => (
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

  const deadlineRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const dismissedRef = useRef(false);

  useEffect(
    function manageSnackbarTimer() {
      dismissedRef.current = false;

      if (item.durationMs === null) return;

      const now0 = Date.now();
      deadlineRef.current = now0 + item.durationMs;
      lastTickRef.current = now0;

      const tick = () => {
        rafRef.current = window.requestAnimationFrame(tick);

        if (dismissedRef.current) return;

        const now = Date.now();
        const dt = now - lastTickRef.current;
        lastTickRef.current = now;

        if (isPaused) {
          if (deadlineRef.current !== null) deadlineRef.current += dt;
          return;
        }

        if (deadlineRef.current !== null && now >= deadlineRef.current) {
          dismissedRef.current = true;
          onDismiss(item.id);
        }
      };

      rafRef.current = window.requestAnimationFrame(tick);

      return () => {
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    },
    [item.id, item.durationMs, isPaused, onDismiss],
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
        {item.title ? <div className={styles.title}>{item.title}</div> : null}
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
