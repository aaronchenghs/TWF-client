import { useEffect, useRef } from "react";
import type { RoomPublicState } from "@twf/contracts";
import { useAppSelector, type AppState } from "@/store/store";
import {
  initializeSoundEffects,
  playSfx,
  stopSfx,
  type SfxId,
} from "@/lib/sounds/soundEffects";
import {
  GAME_ROOM_SOUND_RULES,
  HOST_LOBBY_SOUND_RULES,
  type GameRoomSoundRuntime,
  type GameRoomSoundSnapshot,
  type HostLobbySoundRuntime,
  type HostLobbySoundSnapshot,
  type PlacementSnapshot,
  type SoundRule,
} from "@/lib/constants/soundEffectRules";
import { computeVoteResolution } from "@/lib/voting";
import { resolvePlacedTierId } from "@/lib/tierItems";

/**
 * Sound effects are driven by a small rule engine. Each exported hook builds
 * a domain-specific snapshot of the current UI/game state, compares it to the
 * previous snapshot kept in`engineRef`, and runs an ordered list of sound rules against that diff.
 *
 * Rules do not play audio directly; they emit explicit `play` / `stop`
 * commands, which are dispatched after evaluation. This keeps trigger logic
 * centralized, makes rule ordering easy to audit, and reduces accidental sound
 * playback caused by scattered reactive effects.
 */

type SoundCommand = {
  type: "play" | "stop";
  sfxId: SfxId;
};

export function useHostLobbySoundEffects(
  state: RoomPublicState | null,
  countdownNumber: 3 | 2 | 1 | null = null,
  countdownOutroActive = false,
) {
  const $sfxVolume = useAppSelector(
    (appState: AppState) => appState.userSettings.sfxVolume,
  );
  const engineRef = useRef<{
    prev: HostLobbySoundSnapshot | null;
    runtime: HostLobbySoundRuntime;
  }>({
    prev: null,
    runtime: {},
  });

  useEffect(
    function syncHostLobbySoundEffects() {
      initializeSoundEffects();

      const currentSnapshot = createHostLobbySoundSnapshot(
        state,
        countdownNumber,
        countdownOutroActive,
      );
      const commands = evaluateSoundRules({
        rules: HOST_LOBBY_SOUND_RULES,
        prev: engineRef.current.prev,
        curr: currentSnapshot,
        runtime: engineRef.current.runtime,
      });

      engineRef.current.prev = currentSnapshot;
      dispatchSoundCommands(commands, $sfxVolume > 0);
    },
    [state, countdownNumber, countdownOutroActive, $sfxVolume],
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
  const engineRef = useRef<{
    prev: GameRoomSoundSnapshot | null;
    runtime: GameRoomSoundRuntime;
  }>({
    prev: null,
    runtime: {
      skipDoorbellNextReveal: false,
      wasSfxEnabled: false,
    },
  });

  useEffect(
    function syncGameRoomSoundEffects() {
      initializeSoundEffects();

      const currentSnapshot = createGameRoomSoundSnapshot({
        isPhaseCritical,
        state,
        msLeft,
      });
      const { runtime } = engineRef.current;
      const commands = evaluateSoundRules({
        rules: GAME_ROOM_SOUND_RULES,
        prev: engineRef.current.prev,
        curr: currentSnapshot,
        runtime,
      });

      engineRef.current.prev = currentSnapshot;

      const isSfxEnabled = $sfxVolume > 0;
      if (!isSfxEnabled && runtime.wasSfxEnabled) {
        stopSfx("gameRoom.timer.criticalTick");
      }
      runtime.wasSfxEnabled = isSfxEnabled;

      dispatchSoundCommands(commands, isSfxEnabled);
    },
    [isPhaseCritical, state, msLeft, $sfxVolume],
  );
}

function createHostLobbySoundSnapshot(
  state: RoomPublicState | null,
  countdownNumber: 3 | 2 | 1 | null,
  countdownOutroActive: boolean,
): HostLobbySoundSnapshot {
  return { state, countdownNumber, countdownOutroActive };
}

function createGameRoomSoundSnapshot({
  isPhaseCritical,
  state,
  msLeft,
}: {
  isPhaseCritical: boolean;
  state: RoomPublicState | null;
  msLeft: number | null;
}): GameRoomSoundSnapshot {
  return {
    state,
    phase: state?.phase ?? null,
    msLeft,
    isPhaseCritical,
    turnKey: state
      ? `${state.turnIndex}:${state.currentTurnPlayerId ?? "none"}`
      : null,
    votePreviewPlacement: state ? resolveVotePreviewPlacement(state) : null,
    resultsPlacementKey: resolveResultsPlacementSoundKey(state),
  };
}

function evaluateSoundRules<Snapshot, Runtime>(args: {
  rules: readonly SoundRule<Snapshot, Runtime>[];
  prev: Snapshot | null;
  curr: Snapshot;
  runtime: Runtime;
}): SoundCommand[] {
  const { rules, prev, curr, runtime } = args;
  const commands: SoundCommand[] = [];

  for (const rule of rules) {
    rule.evaluate({
      prev,
      curr,
      runtime,
      play: (sfxId) => {
        commands.push({ type: "play", sfxId });
      },
      stop: (sfxId) => {
        commands.push({ type: "stop", sfxId });
      },
    });
  }

  return commands;
}

function dispatchSoundCommands(
  commands: readonly SoundCommand[],
  isSfxEnabled: boolean,
) {
  for (const command of commands) {
    if (command.type === "stop") {
      stopSfx(command.sfxId);
      continue;
    }

    if (!isSfxEnabled) continue;
    playSfx(command.sfxId);
  }
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

function resolveVotePreviewPlacement(
  state: RoomPublicState,
): PlacementSnapshot {
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
