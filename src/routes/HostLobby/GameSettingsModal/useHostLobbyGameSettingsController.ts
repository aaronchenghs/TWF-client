import { roomSocket } from "@/services/sockets/roomSocket";
import { useCallback, useRef, useState } from "react";
import type * as Contracts from "@twf/contracts";
import {
  areGameSettingsDefault,
  areGameSettingsEqual,
  readSavedHostLobbyGameSettings,
  saveHostLobbyGameSettings,
  type GameSettings,
} from "@/lib/gameSettings";

type RoomPublicState = Contracts.RoomPublicState;

type UseHostLobbyGameSettingsControllerArgs = {
  roomCode: string;
};

export function useHostLobbyGameSettingsController({
  roomCode,
}: UseHostLobbyGameSettingsControllerArgs) {
  const [savedGameSettings, setSavedGameSettings] = useState<GameSettings>(() =>
    readSavedHostLobbyGameSettings(),
  );
  const [roomGameSettings, setRoomGameSettings] = useState<GameSettings | null>(
    null,
  );
  const [pendingGameSettings, setPendingGameSettings] =
    useState<GameSettings | null>(null);

  const restoredSavedSettingsRoomRef = useRef<string | null>(null);

  const handleIncomingRoomState = useCallback(
    (state: RoomPublicState) => {
      const shouldHydrateSavedSettings =
        state.phase === "LOBBY" &&
        restoredSavedSettingsRoomRef.current !== roomCode &&
        !areGameSettingsDefault(savedGameSettings) &&
        areGameSettingsDefault(state.gameSettings);

      if (shouldHydrateSavedSettings) {
        restoredSavedSettingsRoomRef.current = roomCode;
        setPendingGameSettings(savedGameSettings);
        roomSocket.setGameSettings(savedGameSettings);
      }

      setRoomGameSettings(state.gameSettings);
      setPendingGameSettings((currentPending) => {
        const pendingToCompare =
          currentPending ??
          (shouldHydrateSavedSettings ? savedGameSettings : null);
        if (!pendingToCompare) return null;

        return areGameSettingsEqual(state.gameSettings, pendingToCompare)
          ? null
          : pendingToCompare;
      });
    },
    [roomCode, savedGameSettings],
  );

  const handleGameSettingsChange = useCallback(
    (nextSettings: GameSettings) => {
      restoredSavedSettingsRoomRef.current = roomCode;
      saveHostLobbyGameSettings(nextSettings);
      setSavedGameSettings(nextSettings);
      setPendingGameSettings(nextSettings);
      roomSocket.setGameSettings(nextSettings);
    },
    [roomCode],
  );

  return {
    gameSettings: pendingGameSettings ?? roomGameSettings ?? savedGameSettings,
    handleGameSettingsChange,
    handleIncomingRoomState,
  };
}
