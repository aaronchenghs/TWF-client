import { useEffect, useRef, type MutableRefObject } from "react";
import { markPendingRejoinNotice, type RejoinNotice } from "@/lib/session";
import { socketClient } from "@/services/sockets/socketClient";

type UseUnexpectedExitRejoinNoticeOptions = {
  kind: RejoinNotice["kind"];
  roomCode: string;
  isEligible: boolean;
  suppressRef?: MutableRefObject<boolean>;
};

/**
 * Persists a one-time rejoin notice when a tab leaves unexpectedly while still
 * connected to the room (URL navigation, reload, tab/window close).
 */
export function useUnexpectedExitRejoinNotice({
  kind,
  roomCode,
  isEligible,
  suppressRef,
}: UseUnexpectedExitRejoinNoticeOptions) {
  const isArmedRef = useRef(false);
  const latestNoticeRef = useRef({ kind, roomCode, isEligible });

  useEffect(
    function syncLatestNoticeConfig() {
      latestNoticeRef.current = { kind, roomCode, isEligible };
    },
    [kind, roomCode, isEligible],
  );

  useEffect(function armUnexpectedExitTracking() {
    const raf = window.requestAnimationFrame(() => {
      isArmedRef.current = true;
    });

    return () => {
      window.cancelAnimationFrame(raf);
      isArmedRef.current = false;
    };
  }, []);

  useEffect(
    function bindUnexpectedExitHandlers() {
      const maybeMarkRejoinNotice = () => {
        const latest = latestNoticeRef.current;
        if (!isArmedRef.current) return;
        if (!latest.isEligible) return;
        if (suppressRef?.current) return;
        if (!socketClient.isConnected()) return;
        if (!latest.roomCode) return;

        markPendingRejoinNotice({
          kind: latest.kind,
          roomCode: latest.roomCode,
        });
      };

      const handlePageHide = () => {
        maybeMarkRejoinNotice();
      };

      window.addEventListener("pagehide", handlePageHide);

      return () => {
        window.removeEventListener("pagehide", handlePageHide);
        maybeMarkRejoinNotice();
      };
    },
    [suppressRef],
  );
}
