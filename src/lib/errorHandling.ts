import {
  roomSocket,
  type RoomErrorPayload,
} from "../services/sockets/roomSocket";
import { pushSnackbar } from "../store/slices/snackBarSlice";
import { store } from "../store/store";

export function initSocketErrorToasts(): () => void {
  return roomSocket.onRoomError((err: RoomErrorPayload) => {
    store.dispatch(
      pushSnackbar({
        severity: "error",
        title: "Error",
        message: err,
        durationMs: 4500,
      }),
    );
  });
}
