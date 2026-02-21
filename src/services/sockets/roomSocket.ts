import { socketClient } from "@/services/sockets/socketClient";
import { normalizeCode } from "@/lib/stringNormalizers";
import * as Contracts from "@twf/contracts";

type Role = Contracts.Role;
type PlayerId = Contracts.PlayerId;
type TierSetId = Contracts.TierSetId;
type TierSetDefinition = Contracts.TierSetDefinition;
type TierSetSummary = Contracts.TierSetSummary;
type RoomPublicState = Contracts.RoomPublicState;
type ServerToClientEvents = Contracts.ServerToClientEvents;
type RoomJoinPayload = Contracts.RoomJoinPayload;

type RoomCreatedPayload = Parameters<ServerToClientEvents["room:created"]>[0];
type RoomStatePayload = Parameters<ServerToClientEvents["room:state"]>[0];
type RoomJoinedPayload = Parameters<ServerToClientEvents["room:joined"]>[0];
export type RoomErrorPayload = Parameters<
  ServerToClientEvents["room:error"]
>[0];

let lastRoomState: RoomPublicState | null = null;
let lastRoomCode: string | null = null;

const cacheRoomState = (state: RoomStatePayload) => {
  lastRoomState = state as RoomPublicState;
  lastRoomCode = state.code ?? null;
};

const clearRoomCache = () => {
  lastRoomState = null;
  lastRoomCode = null;
};

socketClient.on("room:state", cacheRoomState);
socketClient.on("room:closed", clearRoomCache);
socketClient.on("room:kicked", clearRoomCache);

type ListenArgs<E extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[E]
>;

const DEFAULT_TIMEOUT_MS = 8000;

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error("Unknown error");
  }
}

function waitForEventOrError<E extends keyof ServerToClientEvents, T>(
  event: E,
  map: (...args: ListenArgs<E>) => T,
  timeoutMs: number,
  timeoutLabel = String(event),
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    let offEvent: () => void = () => undefined;
    let offError: () => void = () => undefined;

    let timer: number | null = null;

    const cleanup = () => {
      if (timer !== null) window.clearTimeout(timer);
      offEvent();
      offError();
    };

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const handler = ((...args: ListenArgs<E>) => {
      settle(() => resolve(map(...args)));
    }) as ServerToClientEvents[E];

    offEvent = socketClient.on(event, handler);

    offError = socketClient.on("room:error", (err) => {
      settle(() => reject(toError(err)));
    });

    timer = window.setTimeout(() => {
      settle(() => reject(new Error(`Timed out waiting for ${timeoutLabel}`)));
    }, timeoutMs);
  });
}

/**
 * Room-level socket service.
 * Centralizes event names, payload shaping, and common room workflows.
 */
export const roomSocket = {
  getLastRoomState(code?: string | null): RoomPublicState | null {
    if (!lastRoomState) return null;
    if (!code) return lastRoomState;
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    const cached =
      lastRoomCode == null ? null : normalizeCode(String(lastRoomCode));
    return cached && cached === normalized ? lastRoomState : null;
  },

  async createRoom(role: Role): Promise<RoomCreatedPayload> {
    socketClient.connect();

    const createdP = waitForEventOrError(
      "room:created",
      (payload) => payload,
      DEFAULT_TIMEOUT_MS,
    );

    socketClient.emit("room:create", { role });

    return createdP;
  },

  async listTierSets(timeoutMs = 5000): Promise<TierSetSummary[]> {
    const listedP = waitForEventOrError(
      "tierSets:listed",
      (payload) => payload.tierSets,
      timeoutMs,
    );

    socketClient.emit("tierSets:list");
    return listedP;
  },

  async getTierSet(
    id: TierSetId,
    timeoutMs = 5000,
  ): Promise<TierSetDefinition> {
    const gotP = waitForEventOrError(
      "tierSets:got",
      (payload) => payload.tierSet,
      timeoutMs,
    );

    socketClient.emit("tierSets:get", { id });
    return gotP;
  },

  setTierSet(tierSetId: TierSetId): void {
    socketClient.emit("room:setTierSet", { tierSetId });
  },

  bootPlayerFromLobby(playerId: PlayerId): void {
    socketClient.emit("room:bootPlayerFromLobby", { playerId });
  },

  onRoomKicked(handler: () => void): () => void {
    return socketClient.on("room:kicked", handler);
  },

  /**
   * @deprecated Internal: Do not call directly. Use `joinRoomOrThrow()`.
   */
  joinRoom(input: RoomJoinPayload): void {
    const normalizedCode = normalizeCode(input.code);

    if (input.role === "player") {
      socketClient.emit("room:join", {
        code: normalizedCode,
        role: "player",
        name: input.name,
        clientId: input.clientId,
      });
      return;
    }

    socketClient.emit("room:join", {
      code: normalizedCode,
      role: "host",
      clientId: input.clientId,
    });
  },

  async joinRoomOrThrow(
    input: RoomJoinPayload,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<{ state: RoomPublicState; playerId?: string }> {
    const normalizedCode = normalizeCode(input.code);
    const isPlayer = input.role === "player";

    return new Promise((resolve, reject) => {
      let settled = false;
      let state: RoomPublicState | null = null;
      let playerId: string | undefined;

      let offState: () => void = () => undefined;
      let offJoined: () => void = () => undefined;
      let offError: () => void = () => undefined;

      let timer: number | null = null;

      const cleanup = () => {
        if (timer !== null) window.clearTimeout(timer);
        offState();
        offJoined();
        offError();
      };

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };

      const maybeResolve = () => {
        const resolvedState = state;
        if (!resolvedState) return;
        if (isPlayer && !playerId) return;
        settle(() => resolve({ state: resolvedState, playerId }));
      };

      offState = socketClient.on("room:state", (nextState) => {
        if (nextState.code !== normalizedCode) return;
        state = nextState;
        maybeResolve();
      });

      offJoined = isPlayer
        ? socketClient.on("room:joined", (payload) => {
            playerId = payload.playerId as string;
            maybeResolve();
          })
        : () => undefined;

      offError = socketClient.on("room:error", (err) => {
        settle(() => reject(toError(err)));
      });

      timer = window.setTimeout(() => {
        settle(() =>
          reject(
            new Error(`Timed out waiting for room join (${normalizedCode})`),
          ),
        );
      }, timeoutMs);

      socketClient.connect();
      roomSocket.joinRoom({ ...input, code: normalizedCode });
    });
  },

  startGame(code: string): void {
    socketClient.emit("room:start", { code });
  },

  playAgain(): void {
    socketClient.emit("room:playAgain");
  },

  closeRoom(): void {
    socketClient.emit("room:close");
    socketClient.disconnect();
    clearRoomCache();
  },

  onRoomJoined(handler: (payload: RoomJoinedPayload) => void): () => void {
    return socketClient.on("room:joined", handler);
  },

  onRoomClosed(handler: () => void): () => void {
    return socketClient.on("room:closed", handler);
  },

  onRoomState(handler: (state: RoomStatePayload) => void): () => void {
    return socketClient.on("room:state", handler);
  },

  onRoomError(handler: (err: RoomErrorPayload) => void): () => void {
    return socketClient.on("room:error", handler);
  },

  onPlayAgainQueued(handler: () => void): () => void {
    return socketClient.on("room:playAgainQueued", handler);
  },

  onPlayAgainStarted(handler: () => void): () => void {
    return socketClient.on("room:playAgainStarted", handler);
  },

  // #region DEV TOOLS
  debugNext(): void {
    socketClient.emit("debug:next");
  },

  debugPrev(): void {
    socketClient.emit("debug:prev");
  },

  debugTogglePause(): void {
    socketClient.emit("debug:togglePause");
  },
  // #endregion DEV TOOLS
};
