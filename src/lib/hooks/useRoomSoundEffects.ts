import { useEffect, useRef } from "react";
import type * as Contracts from "@twf/contracts";
import { useAppSelector, type AppState } from "@/store/store";
import {
  initializeSoundEffects,
  playRandomHelloJoinSound,
  playSoundEffect,
} from "@/lib/sounds/soundEffects";

type RoomPublicState = Contracts.RoomPublicState;
type VoteMap = RoomPublicState["votes"];

const TIME_WARNING_THRESHOLD_MS = 5000;

function getConnectedPlayerIdSet(state: RoomPublicState): Set<string> {
  const ids = new Set<string>();
  for (const player of state.players) {
    if (player.connected !== false) ids.add(player.id);
  }
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

function getVoteDirectionDelta(prevVotes: VoteMap, nextVotes: VoteMap) {
  const playerIds = new Set([
    ...Object.keys(prevVotes ?? {}),
    ...Object.keys(nextVotes ?? {}),
  ]);

  let upCount = 0;
  let downCount = 0;

  for (const playerId of playerIds) {
    const prevVote = prevVotes?.[playerId];
    const nextVote = nextVotes?.[playerId];
    if (prevVote === nextVote) continue;

    if (nextVote === -1) upCount += 1;
    else if (nextVote === 1) downCount += 1;
  }

  return { upCount, downCount };
}

function getActiveTimerEndsAt(state: RoomPublicState): number | null {
  switch (state.phase) {
    case "PLACE":
      return state.timers.placeEndsAt;
    case "VOTE":
      return state.timers.voteEndsAt;
    case "RESULTS":
      return state.timers.resultsEndsAt;
    default:
      return null;
  }
}

function useInitializeSoundEffects() {
  useEffect(function setupSoundEffects() {
    initializeSoundEffects();
  }, []);
}

function playPlayerPresenceDeltas(
  prevState: RoomPublicState,
  nextState: RoomPublicState,
) {
  const playerDelta = getPlayerDelta(prevState, nextState);
  if (playerDelta.joinedCount > 0) playSoundEffect("playerJoined");
  if (playerDelta.leftCount > 0) playSoundEffect("playerLeft");
}

export function useHostLobbySoundEffects(state: RoomPublicState | null) {
  const $sfxVolume = useAppSelector(
    (appState: AppState) => appState.userSettings.sfxVolume,
  );
  const previousStateRef = useRef<RoomPublicState | null>(null);

  useInitializeSoundEffects();

  useEffect(
    function handleHostLobbySoundEffects() {
      if (!state) return;

      const prevState = previousStateRef.current;
      previousStateRef.current = state;

      if ($sfxVolume <= 0) return;
      if (!prevState) return;

      const playerDelta = getPlayerDelta(prevState, state);
      if (playerDelta.joinedCount > 0) playRandomHelloJoinSound();
      if (playerDelta.leftCount > 0) playSoundEffect("playerLeft");
    },
    [state, $sfxVolume],
  );
}

export function useGameRoomSoundEffects(state: RoomPublicState | null) {
  const $sfxVolume = useAppSelector(
    (appState: AppState) => appState.userSettings.sfxVolume,
  );
  const previousStateRef = useRef<RoomPublicState | null>(null);
  const warnedTimerWindowKeyRef = useRef<string | null>(null);

  useInitializeSoundEffects();

  useEffect(
    function handleGameRoomStateTransitions() {
      if (!state) return;

      const prevState = previousStateRef.current;
      previousStateRef.current = state;

      if ($sfxVolume <= 0) return;

      if (!prevState) return;

      playPlayerPresenceDeltas(prevState, state);
      if (prevState.phase === "PLACE" && state.phase === "VOTE")
        playSoundEffect("placementLocked");
      if (prevState.phase !== "FINISHED" && state.phase === "FINISHED")
        playSoundEffect("finish");

      const voteDelta = getVoteDirectionDelta(prevState.votes, state.votes);
      if (voteDelta.upCount > 0) playSoundEffect("voteUp");
      if (voteDelta.downCount > 0) playSoundEffect("voteDown");
    },
    [state, $sfxVolume],
  );

  useEffect(
    function handleGameRoomRunningOutOfTimeCue() {
      if ($sfxVolume <= 0) return;
      if (!state) return;

      const endsAt = getActiveTimerEndsAt(state);
      if (endsAt == null) return;

      const timerWindowKey = `${state.phase}:${state.turnIndex}:${
        state.currentItem ?? "none"
      }:${endsAt}`;

      if (warnedTimerWindowKeyRef.current === timerWindowKey) return;

      const msRemaining = endsAt - Date.now();
      if (msRemaining <= 0) return;

      const msUntilWarning = msRemaining - TIME_WARNING_THRESHOLD_MS;
      if (msUntilWarning <= 0) {
        warnedTimerWindowKeyRef.current = timerWindowKey;
        playSoundEffect("runningOutOfTime");
        return;
      }

      const timeoutId = window.setTimeout(() => {
        warnedTimerWindowKeyRef.current = timerWindowKey;
        playSoundEffect("runningOutOfTime");
      }, msUntilWarning);

      return () => {
        window.clearTimeout(timeoutId);
      };
    },
    [
      state,
      state?.phase,
      state?.turnIndex,
      state?.currentItem,
      state?.timers.placeEndsAt,
      state?.timers.voteEndsAt,
      state?.timers.resultsEndsAt,
      $sfxVolume,
    ],
  );
}
