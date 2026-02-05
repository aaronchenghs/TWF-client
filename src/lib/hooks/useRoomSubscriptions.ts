import { useEffect } from "react";
import { roomSocket } from "@/services/sockets/roomSocket";
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
  useEffect(() => {
    if (!roomCode) return;

    const offState = onState ? roomSocket.onRoomState(onState) : () => undefined;
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
  }, [roomCode, onState, onClosed, onKicked]);
}
