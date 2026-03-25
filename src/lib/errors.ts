import { template } from "radashi";

const ERRORS = {
  ROOM_CLOSED: "The host ended the session.",
  PLAYER_KICKED: "The host removed you from the lobby.",
  CONNECTION_TIMEOUT:
    "Unable to reach the game server. Check device network privacy settings and server access.",
} as const;

type ErrorsMap = typeof ERRORS;
type ErrorKey = keyof ErrorsMap;

export function getErrorMessage(
  key: ErrorKey,
  params?: Record<string, string>,
): string {
  const message = ERRORS[key];
  if (!params) return message;
  return template(message, params);
}
