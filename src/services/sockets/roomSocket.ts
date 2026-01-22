import { socketClient } from "./socketClient";
import { normalizeCode } from "../../lib/codeUtils";
import * as Contracts from "@twf/contracts";

type Role = Contracts.Role;
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

function setLastRoomState(state: RoomStatePayload) {
  lastRoomState = state as RoomPublicState;
}

/**
 * Room-level socket service.
 * Centralizes event names, payload shaping, and common room workflows.
 */
export const roomSocket = {
  getLastRoomState(): RoomPublicState | null {
    return lastRoomState;
  },

  clearLastRoomState(): void {
    lastRoomState = null;
  },

  async createRoom(role: Role): Promise<RoomCreatedPayload> {
    socketClient.connect();

    const createdP = socketClient
      .waitFor("room:created")
      .then(([payload]) => payload);

    const errorP = socketClient
      .waitFor("room:error")
      .then(([payload]) => Promise.reject(payload as RoomErrorPayload));

    socketClient.emit("room:create", { role });

    return Promise.race([createdP, errorP]);
  },

  async listTierSets(timeoutMs = 5000): Promise<TierSetSummary[]> {
    const listedP = socketClient
      .waitFor("tierSets:listed", timeoutMs)
      .then(([payload]) => payload.tierSets);

    const errorP = socketClient
      .waitFor("room:error", timeoutMs)
      .then(([msg]) => Promise.reject(new Error(msg)));

    socketClient.emit("tierSets:list");
    return Promise.race([listedP, errorP]);
  },

  async getTierSet(
    id: TierSetId,
    timeoutMs = 5000,
  ): Promise<TierSetDefinition> {
    const gotP = socketClient
      .waitFor("tierSets:got", timeoutMs)
      .then(([payload]) => payload.tierSet);

    const errorP = socketClient
      .waitFor("room:error", timeoutMs)
      .then(([msg]) => Promise.reject(new Error(msg)));

    socketClient.emit("tierSets:get", { id });
    return Promise.race([gotP, errorP]);
  },

  setTierSet(tierSetId: TierSetId): void {
    socketClient.emit("room:setTierSet", { tierSetId });
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
      });
      return;
    }

    socketClient.emit("room:join", { code: normalizedCode, role: "host" });
  },

  async joinRoomOrThrow(
    input: RoomJoinPayload,
    timeoutMs = 3000,
  ): Promise<RoomPublicState> {
    const normalizedCode = normalizeCode(input.code);

    const stateP = socketClient
      .waitFor("room:state", timeoutMs)
      .then(([state]) => {
        if (state.code !== normalizedCode) throw new Error("Unexpected room");
        setLastRoomState(state);
        return state;
      });

    const errorP = socketClient
      .waitFor("room:error", timeoutMs)
      .then(([msg]) => Promise.reject(new Error(msg)));

    this.joinRoom({ ...input, code: normalizedCode });

    return Promise.race([stateP, errorP]);
  },

  startGame(code: string): void {
    socketClient.emit("room:start", { code });
  },

  closeRoom(): void {
    socketClient.emit("room:close");
    socketClient.disconnect();
    this.clearLastRoomState();
  },

  onRoomJoined(handler: (payload: RoomJoinedPayload) => void): () => void {
    return socketClient.on("room:joined", handler);
  },

  onRoomClosed(handler: () => void): () => void {
    return socketClient.on("room:closed", handler);
  },

  onRoomState(handler: (state: RoomStatePayload) => void): () => void {
    return socketClient.on("room:state", (state) => {
      setLastRoomState(state);
      handler(state);
    });
  },

  onRoomError(handler: (err: RoomErrorPayload) => void): () => void {
    return socketClient.on("room:error", handler);
  },

  /**
   * DEV ONLY: advance the server game state to the beginning of the next phase.
   * (PLACE auto-places random tier; VOTE auto-fills agrees.)
   */
  debugNext(): void {
    socketClient.emit("debug:next");
  },

  /** DEV ONLY: revert the server game state to the beginning of the previous phase. */
  debugPrev(): void {
    socketClient.emit("debug:prev");
  },

  /** DEV ONLY: stop the timer for the current phase. Reset timer on toggle ON. */
  debugTogglePause(): void {
    socketClient.emit("debug:togglePause");
  },
};
