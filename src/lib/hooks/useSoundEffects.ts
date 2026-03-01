import { useEffect, useRef } from "react";
import type * as Contracts from "@twf/contracts";
import { useAppSelector, type AppState } from "@/store/store";
import {
  initializeSoundEffects,
  playSfx,
  stopSfx,
} from "@/lib/sounds/soundEffects";
import { computeVoteResolution } from "@/lib/voting";
import { resolvePlacedTierId } from "@/lib/tierItems";
import { getPlayerDelta } from "../players";

type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

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
  state,
  msLeft,
}: {
  isPhaseCritical: boolean;
  state: RoomPublicState | null;
  msLeft: number | null;
}) {
  const $sfxVolume = useAppSelector(
    (appState: AppState) => appState.userSettings.sfxVolume,
  );
  const wasCriticalRef = useRef(false);
  const lastCriticalPhaseRef = useRef<RoomPublicState["phase"] | null>(null);
  const lastPlacementRef = useRef<{
    itemId: TierItemId;
    tierId: TierId | null;
    tierIndex: number | null;
    phase: RoomPublicState["phase"];
  } | null>(null);
  const lastPhaseTimerRef = useRef<{
    phase: RoomPublicState["phase"] | null;
    msLeft: number | null;
  }>({ phase: null, msLeft: null });
  const skipDoorbellNextRevealRef = useRef(false);
  const lastTurnKeyRef = useRef<string | null>(null);
  const lastResultsPlacementKeyRef = useRef<string | null | undefined>(
    undefined,
  );
  const previousPhaseRef = useRef<RoomPublicState["phase"] | null>(null);

  useEffect(function setupSoundEffects() {
    initializeSoundEffects();
  }, []);

  useEffect(
    function playCriticalTimerTicking() {
      const wasCritical = wasCriticalRef.current;
      wasCriticalRef.current = isPhaseCritical;
      const phase = state?.phase ?? null;

      if ($sfxVolume <= 0) return;
      if (isPhaseCritical && !wasCritical) {
        lastCriticalPhaseRef.current = phase;
        playSfx("gameRoom.timer.criticalTick");
        return;
      }

      if (!isPhaseCritical && wasCritical) {
        stopSfx("gameRoom.timer.criticalTick");
        lastCriticalPhaseRef.current = null;
      }

      // Phase changed while critical sound might be playing; stop to be safe.
      if (phase !== lastCriticalPhaseRef.current && wasCritical) {
        stopSfx("gameRoom.timer.criticalTick");
        lastCriticalPhaseRef.current = phase;
      }
    },
    [isPhaseCritical, $sfxVolume, state?.phase],
  );

  useEffect(
    function playItemMovementSounds() {
      if (!state) {
        lastPlacementRef.current = null;
        return;
      }

      const snapshot = resolveVotePreviewPlacement(state);
      const prev = lastPlacementRef.current;
      lastPlacementRef.current = snapshot;

      if (!snapshot) return;
      if (!prev || prev.itemId !== snapshot.itemId) return;
      if (prev.tierIndex === null || snapshot.tierIndex === null) return;
      if (prev.tierIndex === snapshot.tierIndex) return;
      if ($sfxVolume <= 0) return;

      const delta = snapshot.tierIndex - prev.tierIndex;
      if (delta > 0) {
        playSfx("gameRoom.item.movedDown");
      } else if (delta < 0 && snapshot.phase === "VOTE") {
        playSfx("gameRoom.vote.movedUp");
      }
    },
    [state, $sfxVolume],
  );

  useEffect(
    function playBellAtTimeout() {
      const phase = state?.phase ?? null;
      const prev = lastPhaseTimerRef.current;
      lastPhaseTimerRef.current = { phase, msLeft };

      if ($sfxVolume <= 0) return;
      if (msLeft != null && (phase === "PLACE" || phase === "VOTE")) {
        const prevMsLeft =
          prev.phase === phase && typeof prev.msLeft === "number"
            ? prev.msLeft
            : null;

        if (prevMsLeft !== null && prevMsLeft > 0 && msLeft <= 0) {
          playSfx("gameRoom.timer.bell");
          if (phase === "PLACE") {
            skipDoorbellNextRevealRef.current = true;
          }
        }
      }

      // If the phase advanced away from PLACE right as the timer hit 0, ensure we still treat it as a timeout.
      if (
        prev.phase === "PLACE" &&
        prev.msLeft !== null &&
        prev.msLeft <= 0 &&
        phase !== "PLACE"
      ) {
        skipDoorbellNextRevealRef.current = true;
        playSfx("gameRoom.timer.bell");
      }
    },
    [msLeft, state?.phase, $sfxVolume],
  );

  useEffect(
    function playDoorbellOnNewTurn() {
      const phase = state?.phase ?? null;
      const turnIndex = state?.turnIndex ?? null;
      const currentTurnPlayerId = state?.currentTurnPlayerId ?? null;

      if (phase === null) {
        lastTurnKeyRef.current = null;
        skipDoorbellNextRevealRef.current = false;
        return;
      }

      const turnKey = `${turnIndex}:${currentTurnPlayerId ?? "none"}`;
      const prevTurnKey = lastTurnKeyRef.current;
      lastTurnKeyRef.current = turnKey;

      if ($sfxVolume <= 0) return;
      if (phase !== "PLACE") return;
      if (!prevTurnKey) return;
      if (prevTurnKey === turnKey) return;

      const shouldSkip = skipDoorbellNextRevealRef.current;
      skipDoorbellNextRevealRef.current = false;

      if (!shouldSkip) {
        playSfx("gameRoom.turn.doorbell");
      }
    },
    [state?.phase, state?.turnIndex, state?.currentTurnPlayerId, $sfxVolume],
  );

  useEffect(
    function playResultsPlacementSnap() {
      const placementKey = resolveResultsPlacementSoundKey(state);
      const previousPlacementKey = lastResultsPlacementKeyRef.current;
      lastResultsPlacementKeyRef.current = placementKey;

      if ($sfxVolume <= 0) return;
      if (!placementKey) return;
      if (previousPlacementKey === undefined) return;
      if (previousPlacementKey === placementKey) return;

      playSfx("gameRoom.results.snap");
    },
    [state, $sfxVolume],
  );

  useEffect(
    function playFinishedPhaseSound() {
      const phase = state?.phase ?? null;
      const previousPhase = previousPhaseRef.current;
      previousPhaseRef.current = phase;

      if ($sfxVolume <= 0) return;
      if (phase !== "FINISHED") return;
      if (previousPhase === null || previousPhase === "FINISHED") return;

      playSfx("gameRoom.phase.finished");
    },
    [state?.phase, $sfxVolume],
  );
}

function resolveResultsPlacementSoundKey(
  state: RoomPublicState | null,
): string | null {
  if (!state) return null;
  if (state.phase !== "RESULTS") return null;

  const currentItemId = state.currentItem ?? null;
  const resolution = state.lastResolution;
  if (!currentItemId || !resolution) return null;

  return [
    state.turnIndex,
    currentItemId,
    resolution.fromTierId,
    resolution.toTierId,
    resolution.insertIndex,
  ].join(":");
}

function resolveVotePreviewPlacement(state: RoomPublicState): {
  itemId: TierItemId;
  tierId: TierId | null;
  tierIndex: number | null;
  phase: RoomPublicState["phase"];
} | null {
  const currentItemId = state.currentItem ?? null;
  const pendingTierId = state.pendingTierId ?? null;
  if (!currentItemId) return null;

  const tierOrder = state.tierOrder ?? [];
  const tiers = state.tiers ?? {};
  const isVotePhase = state.phase === "VOTE";
  const isResultsPhase = state.phase === "RESULTS";

  const voteGhostResolution =
    currentItemId && pendingTierId
      ? isVotePhase
        ? computeVoteResolution({
            votes: state.votes ?? {},
            eligibleVoterIds: (state.players ?? [])
              .filter(
                (p) =>
                  p.connected !== false && p.id !== state.currentTurnPlayerId,
              )
              .map((p) => p.id),
            fromTierId: pendingTierId,
            tierOrder,
            tiers,
            currentItemId,
          })
        : isResultsPhase && state.lastResolution
          ? state.lastResolution
          : null
      : null;

  const targetTierId =
    voteGhostResolution?.toTierId ??
    resolvePlacedTierId(state, currentItemId) ??
    null;

  const tierIndex = targetTierId ? tierOrder.indexOf(targetTierId) : -1;

  return {
    itemId: currentItemId,
    tierId: targetTierId,
    tierIndex: tierIndex >= 0 ? tierIndex : null,
    phase: state.phase,
  };
}
