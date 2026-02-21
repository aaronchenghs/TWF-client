const ERRORS = {
  ROOM_CLOSED: "The host ended the session.",
  PLAYER_KICKED: "The host removed you from the lobby.",
  CONNECTION_TIMEOUT:
    "Unable to reach the game server. Check device network privacy settings and server access.",
  REJOIN_PLAYER_INSTRUCTIONS:
    "Enter the room code again with any name to rejoin.",
  REJOIN_HOST_LOBBY: "Reconnect as host in lobby {roomCode}.",
  REJOIN_HOST_GAME: "Reconnect as host in game {roomCode}.",
} as const;

type ErrorsMap = typeof ERRORS;
type ErrorKey = keyof ErrorsMap;

export function getErrorMessage(
  key: ErrorKey,
  params?: Record<string, string>,
): string {
  const template = ERRORS[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    return params[token] ?? "";
  });
}
