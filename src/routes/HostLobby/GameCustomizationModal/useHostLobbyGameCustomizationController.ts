import { roomSocket } from "@/services/sockets/roomSocket";
import { useCallback, useRef, useState } from "react";
import type { RoomPublicState } from "@twf/contracts";
import {
  areGameSettingsDefault,
  areGameSettingsEqual,
  normalizeGameSettings,
  readSavedHostLobbyGameSettings,
  saveHostLobbyGameSettings,
  type GameSettings,
} from "@/lib/gameSettings";

type UseHostLobbyGameCustomizationControllerArgs = {
  roomCode: string;
};

export function useHostLobbyGameCustomizationController({
  roomCode,
}: UseHostLobbyGameCustomizationControllerArgs) {
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
      const normalizedRoomGameSettings = normalizeGameSettings(
        state.gameSettings,
      );
      const shouldHydrateSavedSettings =
        state.phase === "LOBBY" &&
        restoredSavedSettingsRoomRef.current !== roomCode &&
        !areGameSettingsDefault(savedGameSettings) &&
        areGameSettingsDefault(normalizedRoomGameSettings);

      if (shouldHydrateSavedSettings) {
        restoredSavedSettingsRoomRef.current = roomCode;
        setPendingGameSettings(savedGameSettings);
        roomSocket.setGameSettings(savedGameSettings);
      }

      setRoomGameSettings(normalizedRoomGameSettings);
      setPendingGameSettings((currentPending) => {
        const pendingToCompare =
          currentPending ??
          (shouldHydrateSavedSettings ? savedGameSettings : null);
        if (!pendingToCompare) return null;

        return areGameSettingsEqual(
          normalizedRoomGameSettings,
          pendingToCompare,
        )
          ? null
          : pendingToCompare;
      });
    },
    [roomCode, savedGameSettings],
  );

  const handleGameCustomizationChange = useCallback(
    (nextSettings: GameSettings) => {
      const normalizedSettings = normalizeGameSettings(nextSettings);
      restoredSavedSettingsRoomRef.current = roomCode;
      saveHostLobbyGameSettings(normalizedSettings);
      setSavedGameSettings(normalizedSettings);
      setPendingGameSettings(normalizedSettings);
      roomSocket.setGameSettings(normalizedSettings);
    },
    [roomCode],
  );

  return {
    gameCustomization:
      pendingGameSettings ?? roomGameSettings ?? savedGameSettings,
    handleGameCustomizationChange,
    handleIncomingRoomState,
  };
}
