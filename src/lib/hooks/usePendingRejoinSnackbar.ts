import { useEffect } from "react";
import {
  consumePendingRejoinNotice,
  type RejoinNotice,
} from "@/lib/session";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { useAppDispatch } from "@/store/store";

const NOTICE_CONSUME_RETRY_MS = 50;
const MAX_NOTICE_CONSUME_ATTEMPTS = 8;

function getRejoinSnackbarCopy(notice: RejoinNotice) {
  const title =
    notice.kind === "host_lobby" ? "Rejoin Your Lobby" : "Rejoin Your Game";
  const message =
    notice.kind === "player"
      ? "Enter the room code again with any name to rejoin."
      : notice.kind === "host_lobby"
        ? `Reconnect as host in lobby ${notice.roomCode}.`
        : `Reconnect as host in game ${notice.roomCode}.`;

  return { title, message };
}

/**
 * Reads and clears any pending rejoin notice on route changes, then shows it
 * as a snackbar.
 */
export function usePendingRejoinSnackbar(routeKey: string) {
  const dispatch = useAppDispatch();

  useEffect(
    function showPendingRejoinNotice() {
      let handled = false;
      let attempts = 0;

      const consumeAndShow = () => {
        if (handled) return;

        const notice = consumePendingRejoinNotice();
        if (!notice) return;

        handled = true;
        const { title, message } = getRejoinSnackbarCopy(notice);

        dispatch(
          pushSnackbar({
            severity: "info",
            title,
            message,
          }),
        );
      };

      consumeAndShow();

      const timer = window.setInterval(() => {
        attempts += 1;
        consumeAndShow();

        if (handled || attempts >= MAX_NOTICE_CONSUME_ATTEMPTS) {
          window.clearInterval(timer);
        }
      }, NOTICE_CONSUME_RETRY_MS);

      return () => {
        window.clearInterval(timer);
      };
    },
    [dispatch, routeKey],
  );
}
