import { useCallback, useEffect, useState } from "react";
import { roomSocket } from "@/services/sockets/roomSocket";
import { socketClient } from "@/services/sockets/socketClient";

type UseActionLocksOptions = {
  timeoutMs?: number;
};

export function useActionLocks<T extends string>(
  shouldRemainLockedByKey: Record<T, boolean>,
  { timeoutMs = 6000 }: UseActionLocksOptions = {},
) {
  const [locks, setLocks] = useState<Record<T, boolean>>(() => {
    const initial = {} as Record<T, boolean>;
    (Object.keys(shouldRemainLockedByKey) as T[]).forEach((key) => {
      initial[key] = false;
    });
    return initial;
  });

  const lock = useCallback((key: T) => {
    setLocks((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const unlock = useCallback((key: T) => {
    setLocks((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: false };
    });
  }, []);

  const unlockAll = useCallback(() => {
    setLocks((prev) => {
      let changed = false;
      const next = { ...prev };
      (Object.keys(next) as T[]).forEach((key) => {
        if (!next[key]) return;
        next[key] = false;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, []);

  const isLocked = useCallback((key: T) => !!locks[key], [locks]);

  useEffect(
    function releaseLocksAfterStateAdvances() {
      queueMicrotask(() => {
        setLocks((prev) => {
          let changed = false;
          const next = { ...prev };

          (Object.keys(shouldRemainLockedByKey) as T[]).forEach((key) => {
            if (!next[key]) return;
            if (shouldRemainLockedByKey[key]) return;
            next[key] = false;
            changed = true;
          });

          return changed ? next : prev;
        });
      });
    },
    [shouldRemainLockedByKey],
  );

  useEffect(
    function releaseLocksAfterTimeout() {
      const activeKeys = (Object.keys(locks) as T[]).filter(
        (key) => locks[key],
      );
      if (activeKeys.length === 0) return;

      const timeoutIds = activeKeys.map((key) =>
        window.setTimeout(() => {
          unlock(key);
        }, timeoutMs),
      );

      return () => {
        timeoutIds.forEach((timeoutId) => {
          window.clearTimeout(timeoutId);
        });
      };
    },
    [locks, timeoutMs, unlock],
  );

  useEffect(
    function releaseLocksOnErrorsAndDisconnect() {
      const hasActiveLock = (Object.keys(locks) as T[]).some(
        (key) => locks[key],
      );
      if (!hasActiveLock) return;

      const offRoomError = roomSocket.onRoomError(() => {
        unlockAll();
      });

      const offDisconnect = socketClient.onDisconnect(() => {
        unlockAll();
      });

      return () => {
        offRoomError();
        offDisconnect();
      };
    },
    [locks, unlockAll],
  );

  return { lock, unlock, unlockAll, isLocked };
}
