import { useEffect } from "react";
import { consumePendingRejoinNotice, type RejoinNotice } from "@/lib/session";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import { getErrorMessage } from "@/lib/errors";
import { computeRoomCodeDisplayValue } from "@/lib/roomCode";

const NOTICE_CONSUME_RETRY_MS = 50;
const MAX_NOTICE_CONSUME_ATTEMPTS = 8;

function getRejoinSnackbarCopy(notice: RejoinNotice, isStreamerMode: boolean) {
  const title =
    notice.kind === "host_lobby" ? "Rejoin Your Lobby" : "Rejoin Your Game";

  const { displayRoomCode: roomCode } = computeRoomCodeDisplayValue({
    roomCode: notice.roomCode,
    isStreamerMode,
  });
  let message: string;

  switch (notice.kind) {
    case "player":
      message = getErrorMessage("REJOIN_PLAYER_INSTRUCTIONS");
      break;
    case "host_lobby":
      message = getErrorMessage("REJOIN_HOST_LOBBY", { roomCode });
      break;
    case "host_game":
      message = getErrorMessage("REJOIN_HOST_GAME", { roomCode });
      break;
  }

  return { title, message };
}

/**
 * Reads and clears any pending rejoin notice on route changes, then shows it
 * as a snackbar.
 */
export function usePendingRejoinSnackbar(routeKey: string) {
  const dispatch = useAppDispatch();
  const $isStreamerMode = useAppSelector(
    (state: AppState) => state.userSettings.isStreamerMode,
  );

  useEffect(
    function showPendingRejoinNotice() {
      let handled = false;
      let attempts = 0;

      const consumeAndShow = () => {
        if (handled) return;

        const notice = consumePendingRejoinNotice();
        if (!notice) return;

        handled = true;
        const { title, message } = getRejoinSnackbarCopy(
          notice,
          $isStreamerMode,
        );

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
    [dispatch, routeKey, $isStreamerMode],
  );
}
