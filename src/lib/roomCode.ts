import { CODE_LENGTH } from "@twf/contracts";
import { normalizeCode } from "@/lib/stringNormalizers";
import { useAppSelector, type AppState } from "@/store/store";


type RoomCodeDisplayValue = {
  roomCode: string;
  isRoomCodeValid: boolean;
  displayRoomCode: string;
};

export function computeRoomCodeDisplayValue({
  roomCode,
  isStreamerMode,
}: {
  roomCode: string | null | undefined;
  isStreamerMode: boolean;
}): RoomCodeDisplayValue {
  const normalizedRoomCode = normalizeCode(roomCode ?? "");
  const isRoomCodeValid = normalizedRoomCode.length === CODE_LENGTH;
  const displayRoomCode = isRoomCodeValid
    ? isStreamerMode
      ? "****"
      : normalizedRoomCode
    : "----";

  return { roomCode: normalizedRoomCode, isRoomCodeValid, displayRoomCode };
}

export function useRoomCodeDisplayValue(
  roomCode: string | null | undefined,
): RoomCodeDisplayValue {
  const $isStreamerMode = useAppSelector(
    (state: AppState) => state.userSettings.isStreamerMode,
  );

  return computeRoomCodeDisplayValue({
    roomCode,
    isStreamerMode: $isStreamerMode,
  });
}
