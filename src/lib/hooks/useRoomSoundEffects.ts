import { useEffect, useRef } from "react";
import type * as Contracts from "@twf/contracts";
import { useAppSelector, type AppState } from "@/store/store";
import { initializeSoundEffects, playSfx } from "@/lib/sounds/soundEffects";

type RoomPublicState = Contracts.RoomPublicState;

function getConnectedPlayerIdSet(state: RoomPublicState): Set<string> {
  const ids = new Set<string>();
  for (const player of state.players)
    if (player.connected !== false) ids.add(player.id);
  return ids;
}

function getPlayerDelta(prev: RoomPublicState, next: RoomPublicState) {
  const prevIds = getConnectedPlayerIdSet(prev);
  const nextIds = getConnectedPlayerIdSet(next);

  let joinedCount = 0;
  let leftCount = 0;
  for (const id of nextIds) if (!prevIds.has(id)) joinedCount += 1;
  for (const id of prevIds) if (!nextIds.has(id)) leftCount += 1;

  return { joinedCount, leftCount };
}

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
