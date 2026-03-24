import type { RoomPublicState, TierId, TierItemId } from "@twf/contracts";
import type { SfxId } from "@/lib/sounds/soundEffects";
import { getPlayerDelta } from "@/lib/players";


export type SoundRule<Snapshot, Runtime> = {
  id: string;
  evaluate: (args: {
    prev: Snapshot | null;
    curr: Snapshot;
    runtime: Runtime;
    play: (sfxId: SfxId) => void;
    stop: (sfxId: SfxId) => void;
  }) => void;
};

export type HostLobbySoundSnapshot = {
  state: RoomPublicState | null;
  countdownNumber: 3 | 2 | 1 | null;
};

export type HostLobbySoundRuntime = Record<never, never>;

export type PlacementSnapshot = {
  itemId: TierItemId;
  tierId: TierId | null;
  tierIndex: number | null;
  phase: RoomPublicState["phase"];
} | null;

export type GameRoomSoundSnapshot = {
  state: RoomPublicState | null;
  phase: RoomPublicState["phase"] | null;
  msLeft: number | null;
  isPhaseCritical: boolean;
  turnKey: string | null;
  votePreviewPlacement: PlacementSnapshot;
  resultsPlacementKey: string | null;
};

export type GameRoomSoundRuntime = {
  skipDoorbellNextReveal: boolean;
  wasSfxEnabled: boolean;
};

export const HOST_LOBBY_SOUND_RULES: readonly SoundRule<
  HostLobbySoundSnapshot,
  HostLobbySoundRuntime
>[] = [
  {
    id: "playerJoined",
    evaluate({ prev, curr, play }) {
      if (!prev?.state || !curr.state) return;

      const playerDelta = getPlayerDelta(prev.state, curr.state);
      if (playerDelta.joinedCount > 0) play("hostLobby.playerJoined.hello");
    },
  },
  {
    id: "playerLeft",
    evaluate({ prev, curr, play }) {
      if (!prev?.state || !curr.state) return;

      const playerDelta = getPlayerDelta(prev.state, curr.state);
      if (playerDelta.leftCount > 0) play("hostLobby.playerLeft.whoosh");
    },
  },
  {
    id: "countdownNumber",
    evaluate({ prev, curr, play }) {
      if (curr.countdownNumber === null) return;
      if (prev?.countdownNumber === curr.countdownNumber) return;

      if (curr.countdownNumber === 3) {
        play("hostLobby.countdown.three");
      } else if (curr.countdownNumber === 2) {
        play("hostLobby.countdown.two");
      } else {
        play("hostLobby.countdown.one");
      }
    },
  },
];

export const GAME_ROOM_SOUND_RULES: readonly SoundRule<
  GameRoomSoundSnapshot,
  GameRoomSoundRuntime
>[] = [
  {
    id: "resetOnDisconnect",
    evaluate({ curr, runtime }) {
      if (curr.state) return;
      runtime.skipDoorbellNextReveal = false;
    },
  },
  {
    id: "criticalTick",
    evaluate({ prev, curr, play, stop }) {
      if (
        prev?.isPhaseCritical &&
        (!curr.isPhaseCritical || curr.phase !== prev.phase)
      ) {
        stop("gameRoom.timer.criticalTick");
        return;
      }

      if (curr.isPhaseCritical && !prev?.isPhaseCritical)
        play("gameRoom.timer.criticalTick");
    },
  },
  {
    id: "votePreviewMovement",
    evaluate({ prev, curr, play }) {
      const previousPlacement = prev?.votePreviewPlacement;
      const currentPlacement = curr.votePreviewPlacement;

      if (!previousPlacement || !currentPlacement) return;
      if (previousPlacement.itemId !== currentPlacement.itemId) return;
      if (
        previousPlacement.tierIndex === null ||
        currentPlacement.tierIndex === null
      )
        return;
      if (previousPlacement.tierIndex === currentPlacement.tierIndex) return;

      const delta = currentPlacement.tierIndex - previousPlacement.tierIndex;
      if (delta > 0) {
        play("gameRoom.item.movedDown");
      } else if (delta < 0 && currentPlacement.phase === "VOTE") {
        play("gameRoom.vote.movedUp");
      }
    },
  },
  {
    id: "timeoutBell",
    evaluate({ prev, curr, runtime, play }) {
      if (!prev) return;

      if (
        curr.msLeft != null &&
        (curr.phase === "PLACE" || curr.phase === "VOTE")
      ) {
        const previousMsLeft =
          prev.phase === curr.phase && typeof prev.msLeft === "number"
            ? prev.msLeft
            : null;

        if (previousMsLeft !== null && previousMsLeft > 0 && curr.msLeft <= 0) {
          play("gameRoom.timer.bell");
          if (curr.phase === "PLACE") runtime.skipDoorbellNextReveal = true;
        }
      }

      // If the phase advanced away from PLACE right as the timer hit 0, treat it
      // as a timeout so the next PLACE reveal can suppress its doorbell.
      if (
        prev.phase === "PLACE" &&
        prev.msLeft !== null &&
        prev.msLeft <= 0 &&
        curr.phase !== "PLACE"
      ) {
        runtime.skipDoorbellNextReveal = true;
        play("gameRoom.timer.bell");
      }
    },
  },
  {
    id: "newTurnDoorbell",
    evaluate({ prev, curr, runtime, play }) {
      if (curr.phase !== "PLACE") return;
      if (!prev?.turnKey || !curr.turnKey) return;
      if (prev.turnKey === curr.turnKey) return;

      const shouldSkip = runtime.skipDoorbellNextReveal;
      runtime.skipDoorbellNextReveal = false;

      if (!shouldSkip) play("gameRoom.turn.doorbell");
    },
  },
  {
    id: "placementRevealDrumRoll",
    evaluate({ prev, curr, play }) {
      if (!prev) return;
      if (curr.phase !== "VOTE") return;
      if (prev.phase === "VOTE") return;
      if (!curr.state?.currentItem) return;

      play("gameRoom.reveal.drumRoll");
    },
  },
  {
    id: "resultsPlacementSnap",
    evaluate({ prev, curr, play }) {
      if (!curr.resultsPlacementKey) return;
      if (!prev) return;
      if (prev.resultsPlacementKey === curr.resultsPlacementKey) return;

      play("gameRoom.results.snap");
    },
  },
  {
    id: "finishedPhase",
    evaluate({ prev, curr, play }) {
      if (!prev) return;
      if (curr.phase !== "FINISHED") return;
      if (prev.phase === "FINISHED") return;

      play("gameRoom.phase.finished");
    },
  },
];
