import {
  roomSocket,
  type RoomErrorPayload,
} from "@/services/sockets/roomSocket";
import { socketClient } from "@/services/sockets/socketClient";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { store } from "@/store/store";

export function initSocketErrorToasts(): () => void {
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
    store.dispatch(
      pushSnackbar({
        severity: "error",
        title: "Connection failed",
        message,
        durationMs: 4500,
      }),
    );
  });

  return () => {
    offRoomError();
    offConnectError();
  };
}
