export const ROUTES = {
  LANDING: "/",
  HOST_LOBBY: "/host",
  PLAYER_SESSION: "/player",
  GAME_ROOM: "/game",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const QUICK_ACTIONS_HIDDEN_ROUTE_PATTERNS = [
  ROUTES.PLAYER_SESSION,
] as const;

export const VERSION_TAG_VISIBLE_ROUTE_PATTERNS = [
  ROUTES.LANDING,
  ROUTES.HOST_LOBBY,
] as const;

export function matchesRoutePath(pathname: string, route: RoutePath) {
  return pathname === route || pathname.startsWith(`${route}/`);
}
