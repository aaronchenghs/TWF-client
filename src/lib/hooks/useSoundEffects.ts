import { useEffect, useRef } from "react";
import type * as Contracts from "@twf/contracts";
import { useAppSelector, type AppState } from "@/store/store";
import { initializeSoundEffects, playSfx } from "@/lib/sounds/soundEffects";
import { getPlayerDelta } from "../players";

type RoomPublicState = Contracts.RoomPublicState;

export function useHostLobbySoundEffects(state: RoomPublicState | null) {
  const $sfxVolume = useAppSelector(
    (appState: AppState) => appState.userSettings.sfxVolume,
  );
  const previousStateRef = useRef<RoomPublicState | null>(null);

  useEffect(function setupSoundEffects() {
    initializeSoundEffects();
  }, []);

  useEffect(
    function handleHostLobbySoundEffects() {
      if (!state) return;

      const prevState = previousStateRef.current;
      previousStateRef.current = state;

      if ($sfxVolume <= 0) return;
      if (!prevState) return;

      const playerDelta = getPlayerDelta(prevState, state);
      if (playerDelta.joinedCount > 0) playSfx("hostLobby.playerJoined.hello");
      if (playerDelta.leftCount > 0) playSfx("hostLobby.playerLeft.whoosh");
    },
    [state, $sfxVolume],
  );
}

export function useGameRoomSoundEffects({
  isPhaseCritical,
}: {
  isPhaseCritical: boolean;
}) {
  const $sfxVolume = useAppSelector(
    (appState: AppState) => appState.userSettings.sfxVolume,
  );
  const wasCriticalRef = useRef(false);

  useEffect(function setupSoundEffects() {
    initializeSoundEffects();
  }, []);

  useEffect(
    function playCriticalTimerTicking() {
      const wasCritical = wasCriticalRef.current;
      wasCriticalRef.current = isPhaseCritical;

      if ($sfxVolume <= 0) return;
      if (!isPhaseCritical) return;
      if (wasCritical) return;

      playSfx("gameRoom.timer.criticalTick");
    },
    [isPhaseCritical, $sfxVolume],
  );
}
