export const ROUTES = {
  LANDING: "/",
  HOST_LOBBY: "/host",
  PLAYER_SESSION: "/player",
  GAME_ROOM: "/game",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
