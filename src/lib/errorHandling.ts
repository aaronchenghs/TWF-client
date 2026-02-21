import {
  roomSocket,
  type RoomErrorPayload,
} from "@/services/sockets/roomSocket";
import { socketClient } from "@/services/sockets/socketClient";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { store } from "@/store/store";
import { getErrorMessage } from "@/lib/errors";

const CONNECT_ERROR_TOAST_COOLDOWN_MS = 60_000;

export function initSocketErrorToasts(): () => void {
  let lastConnectErrorAt = 0;

  const offRoomError = roomSocket.onRoomError((err: RoomErrorPayload) => {
    store.dispatch(
      pushSnackbar({
        severity: "error",
        title: "Error",
        message: err,
        durationMs: 4500,
      }),
    );
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
    offRoomError();
    offConnectError();
  };
}
