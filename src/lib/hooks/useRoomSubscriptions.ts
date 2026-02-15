import { useEffect } from "react";
import { roomSocket } from "@/services/sockets/roomSocket";
import { normalizeCode } from "@/lib/codeUtils";
import type * as Contracts from "@twf/contracts";

type RoomPublicState = Contracts.RoomPublicState;

type Options = {
  roomCode: string | null | undefined;
  onState?: (state: RoomPublicState) => void;
  onClosed?: () => void;
  onKicked?: () => void;
};

export function useRoomSubscriptions({
  roomCode,
  onState,
  onClosed,
  onKicked,
}: Options) {
  useEffect(
    function subscribeToRoomEvents() {
      if (!roomCode) return;
      const normalizedRoomCode = normalizeCode(roomCode);

      if (onState) {
        const cached = roomSocket.getLastRoomState(roomCode);
        if (cached) onState(cached);
      }

      const offState = onState
        ? roomSocket.onRoomState((nextState) => {
            if (normalizeCode(nextState.code) !== normalizedRoomCode) return;
            onState(nextState);
          })
        : () => undefined;

      const offClosed = onClosed
        ? roomSocket.onRoomClosed(onClosed)
        : () => undefined;

      const offKicked = onKicked
        ? roomSocket.onRoomKicked(onKicked)
        : () => undefined;

      return () => {
        offState();
        offClosed();
        offKicked();
      };
    },
    [roomCode, onState, onClosed, onKicked],
  );
}
