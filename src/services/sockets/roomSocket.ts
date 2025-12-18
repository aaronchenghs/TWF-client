import type { Role, ServerToClientEvents } from "@twf/contracts";
import { socketClient } from "./socketClient";

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
  joinRoom(input: { code: string; role: Role; name?: string }): void {
    const normalized = input.code.trim().toUpperCase();

    socketClient.emit("room:join", {
      code: normalized,
      role: input.role,
      ...(input.name ? { name: input.name } : {}),
    });
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
