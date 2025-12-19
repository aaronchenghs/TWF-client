import type {
  Role,
  RoomJoinPayload,
  RoomPublicState,
  ServerToClientEvents,
} from "@twf/contracts";
import { socketClient } from "./socketClient";
import { normalizeCode } from "../../lib/codeUtils";

type RoomCreatedPayload = Parameters<ServerToClientEvents["room:created"]>[0];
type RoomStatePayload = Parameters<ServerToClientEvents["room:state"]>[0];
type RoomErrorPayload = Parameters<ServerToClientEvents["room:error"]>[0];

/**
 * Room-level socket service.
 * Centralizes event names, payload shaping, and common room workflows.
 */
export const roomSocket = {
  /**
   * Requests a new room from the server and resolves with `{ code }`.
   * Rejects if a `room:error` arrives first.
   */
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

  /**
   * Attempts to join an existing room.
   * Normalizes the room code and emits the join request.
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
    if (input.role === "host") {
      socketClient.emit("room:join", {
        code: normalizedCode,
        role: "host",
      });
      return;
    }
  },

  async joinRoomOrThrow(
    input: RoomJoinPayload,
    timeoutMs = 2000
  ): Promise<RoomPublicState> {
    const normalizedCode = normalizeCode(input.code);

    socketClient.connect();

    const stateP = socketClient
      .waitFor("room:state", timeoutMs)
      .then(([state]) => {
        if (state.code !== normalizedCode) throw new Error("Unexpected room");
        return state;
      });

    const errorP = socketClient
      .waitFor("room:error", timeoutMs)
      .then(([msg]) => Promise.reject(new Error(msg)));

    this.joinRoom({ ...input, code: normalizedCode });

    return Promise.race([stateP, errorP]);
  },

  /** Subscribes to room state updates; returns an unsubscribe function. */
  onRoomState(handler: (state: RoomStatePayload) => void): () => void {
    return socketClient.on("room:state", handler);
  },

  /** Subscribes to room errors; returns an unsubscribe function. */
  onRoomError(handler: (err: RoomErrorPayload) => void): () => void {
    return socketClient.on("room:error", handler);
  },
};
