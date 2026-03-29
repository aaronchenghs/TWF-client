import {
  roomSocket,
  type RoomErrorPayload,
} from "@/services/sockets/roomSocket";
import { socketClient } from "@/services/sockets/socketClient";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { store } from "@/store/store";
import { getErrorMessage } from "@/lib/errors";

const CONNECT_ERROR_TOAST_COOLDOWN_MS = 60_000;
const ROOM_ERROR_TOAST_DELAY_MS = 250;
const ROOM_TERMINAL_ERROR_SUPPRESSION_MS = 1_500;

export function initSocketErrorToasts(): () => void {
  let lastConnectErrorAt = 0;
  let lastRoomTerminalEventAt = 0;
  let pendingRoomErrorToastTimer: number | null = null;

  function clearPendingRoomErrorToast() {
    if (pendingRoomErrorToastTimer === null) return;
    window.clearTimeout(pendingRoomErrorToastTimer);
    pendingRoomErrorToastTimer = null;
  }

  function markRoomTerminalEvent() {
    lastRoomTerminalEventAt = Date.now();
    clearPendingRoomErrorToast();
  }

  const offRoomClosed = roomSocket.onRoomClosed(markRoomTerminalEvent);
  const offRoomKicked = roomSocket.onRoomKicked(markRoomTerminalEvent);

  const offRoomError = roomSocket.onRoomError((err: RoomErrorPayload) => {
    clearPendingRoomErrorToast();

    pendingRoomErrorToastTimer = window.setTimeout(() => {
      pendingRoomErrorToastTimer = null;

      if (Date.now() - lastRoomTerminalEventAt < ROOM_TERMINAL_ERROR_SUPPRESSION_MS) {
        return;
      }

      store.dispatch(
        pushSnackbar({
          severity: "error",
          title: "Error",
          message: err,
          durationMs: 4500,
        }),
      );
    }, ROOM_ERROR_TOAST_DELAY_MS);
  });

  const offConnectError = socketClient.onConnectError((message) => {
    const now = Date.now();
    if (now - lastConnectErrorAt < CONNECT_ERROR_TOAST_COOLDOWN_MS) return;
    lastConnectErrorAt = now;

    const normalizedMessage = message.trim().toLowerCase();
    const friendlyMessage =
      normalizedMessage === "timeout"
        ? getErrorMessage("CONNECTION_TIMEOUT")
        : message;

    store.dispatch(
      pushSnackbar({
        severity: "error",
        title: "Connection failed",
        message: friendlyMessage,
        durationMs: 4500,
      }),
    );
  });

  return () => {
    clearPendingRoomErrorToast();
    offRoomClosed();
    offRoomKicked();
    offRoomError();
    offConnectError();
  };
}
