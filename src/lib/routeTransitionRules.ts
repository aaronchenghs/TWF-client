import { ROUTES, type RoutePath } from "../routes/routes";

export type TransitionDirection = "left" | "right";

function routeMatches(pathname: string, base: RoutePath) {
  return pathname === base || pathname.startsWith(base + "/");
}

type RouteTransitionRule = {
  from: RoutePath;
  to: RoutePath;
  dir: TransitionDirection;
};

const TRANSITION_RULES: readonly RouteTransitionRule[] = [
  { from: ROUTES.LANDING, to: ROUTES.HOST_LOBBY, dir: "right" },
  { from: ROUTES.HOST_LOBBY, to: ROUTES.LANDING, dir: "left" },

  { from: ROUTES.HOST_LOBBY, to: ROUTES.GAME_ROOM, dir: "left" },
  { from: ROUTES.GAME_ROOM, to: ROUTES.HOST_LOBBY, dir: "right" },

  { from: ROUTES.LANDING, to: ROUTES.PLAYER_SESSION, dir: "left" },
  { from: ROUTES.PLAYER_SESSION, to: ROUTES.LANDING, dir: "right" },
] as const;

export function getRouteTransitionDirection(
  fromPathname: string,
  toPathname: string,
): TransitionDirection {
  const rule = TRANSITION_RULES.find(
    (r) => routeMatches(fromPathname, r.from) && routeMatches(toPathname, r.to),
  );
  return rule?.dir ?? "left";
}
