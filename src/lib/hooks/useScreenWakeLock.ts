import { type MutableRefObject, useEffect, useRef } from "react";

type WakeLockType = "screen";
type WakeLockSentinelLike = EventTarget & {
  released: boolean;
  release(): Promise<void>;
};

/**
 * Keeps the device display awake while screens like the host lobby or game room
 * are open so the app does not dim or sleep during long periods of low input.
 * Uses the browser Screen Wake Lock API when available, stores the active
 * sentinel, and re-requests the lock after visibility changes or browser-driven
 * releases.
 */
export function useScreenWakeLock({ enabled }: { enabled: boolean }) {
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const isRequestPendingRef = useRef(false);

  useEffect(
    function keepScreenAwake() {
      if (!enabled) return;

      const wakeLockApi = getWakeLockApi();
      if (!wakeLockApi) return;

      const controller = createScreenWakeLockController({
        wakeLockApi,
        wakeLockRef,
        isRequestPendingRef,
      });
      void controller.request();

      document.addEventListener(
        "visibilitychange",
        controller.handleVisibilityChange,
      );

      return () => {
        document.removeEventListener(
          "visibilitychange",
          controller.handleVisibilityChange,
        );
        void controller.dispose();
      };
    },
    [enabled],
  );
}

// #region utilities

type WakeLockApi = {
  request(type: WakeLockType): Promise<WakeLockSentinelLike>;
};

type ScreenWakeLockController = {
  request(): Promise<void>;
  handleVisibilityChange(): void;
  dispose(): Promise<void>;
};

type CreateScreenWakeLockControllerArgs = {
  wakeLockApi: WakeLockApi;
  wakeLockRef: MutableRefObject<WakeLockSentinelLike | null>;
  isRequestPendingRef: MutableRefObject<boolean>;
};

/** Returns the browser-native wake lock API when the environment supports it. */
function getWakeLockApi(): WakeLockApi | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock ?? null;
}

/** Creates a small controller that owns wake lock request and cleanup flow. */
function createScreenWakeLockController({
  wakeLockApi,
  wakeLockRef,
  isRequestPendingRef,
}: CreateScreenWakeLockControllerArgs): ScreenWakeLockController {
  let isDisposed = false;

  function clearStoredWakeLock(wakeLock: WakeLockSentinelLike) {
    wakeLock.removeEventListener("release", handleWakeLockRelease);
    if (wakeLockRef.current === wakeLock) wakeLockRef.current = null;
  }

  function hasActiveWakeLock() {
    const wakeLock = wakeLockRef.current;
    return !!wakeLock && !wakeLock.released;
  }

  function canRequestWakeLock() {
    if (isDisposed) return false;
    if (document.visibilityState !== "visible") return false;
    if (isRequestPendingRef.current) return false;
    if (hasActiveWakeLock()) return false;
    return true;
  }

  async function safelyReleaseWakeLock(wakeLock: WakeLockSentinelLike) {
    clearStoredWakeLock(wakeLock);
    try {
      if (!wakeLock.released) await wakeLock.release();
    } catch {
      // Ignore release failures. The browser may have already revoked it.
    }
  }

  async function releaseCurrentWakeLock() {
    const wakeLock = wakeLockRef.current;
    if (!wakeLock) return;
    await safelyReleaseWakeLock(wakeLock);
  }

  /** Best-effort releases a wake lock that arrived after disposal started. */
  async function releaseDiscardedWakeLock(wakeLock: WakeLockSentinelLike) {
    try {
      if (!wakeLock.released) await wakeLock.release();
    } catch {
      // Ignore best-effort cleanup failures on unmount.
    }
  }

  /** Requests a new screen wake lock and wires release handling to it. */
  async function request() {
    if (!canRequestWakeLock()) return;

    const staleWakeLock = wakeLockRef.current;
    if (staleWakeLock?.released) clearStoredWakeLock(staleWakeLock);

    isRequestPendingRef.current = true;

    try {
      const nextWakeLock = await wakeLockApi.request("screen");

      if (isDisposed) {
        await releaseDiscardedWakeLock(nextWakeLock);
        return;
      }

      wakeLockRef.current = nextWakeLock;
      nextWakeLock.addEventListener("release", handleWakeLockRelease);
    } catch {
      wakeLockRef.current = null;
    } finally {
      isRequestPendingRef.current = false;
    }
  }

  function requestWakeLockIfPossible() {
    if (document.visibilityState !== "visible") return;
    void request();
  }

  /** Clears released lock state and tries to reacquire it when possible. */
  function handleWakeLockRelease(event: Event) {
    const releasedWakeLock = event.currentTarget;
    if (releasedWakeLock instanceof EventTarget) {
      releasedWakeLock.removeEventListener("release", handleWakeLockRelease);
      if (wakeLockRef.current === releasedWakeLock) wakeLockRef.current = null;
    } else {
      wakeLockRef.current = null;
    }

    if (isDisposed) return;
    requestWakeLockIfPossible();
  }

  /** Marks the controller disposed and releases any active wake lock. */
  async function dispose() {
    isDisposed = true;
    await releaseCurrentWakeLock();
  }

  return {
    request,
    handleVisibilityChange: requestWakeLockIfPossible,
    dispose,
  };
}

// #endregion utilities
