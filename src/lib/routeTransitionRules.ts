import { ROUTES, type RoutePath } from "../routes/routes";

export type TransitionKind = "fade" | "iris";

type TransitionRule = {
  from: RoutePath;
  to: RoutePath;
  kind: TransitionKind;
};

const TRANSITION_RULES: readonly TransitionRule[] = [
  { from: ROUTES.HOST_LOBBY, to: ROUTES.GAME_ROOM, kind: "iris" },
  { from: ROUTES.GAME_ROOM, to: ROUTES.HOST_LOBBY, kind: "iris" },
  { from: ROUTES.GAME_ROOM, to: ROUTES.LANDING, kind: "iris" },
];

function routeMatches(pathname: string, base: RoutePath) {
  return pathname === base || pathname.startsWith(base + "/");
}

export function getRouteTransitionKind(
  fromPathname: string,
  toPathname: string,
): TransitionKind {
  const matchedRule = TRANSITION_RULES.find(
    (rule) =>
      routeMatches(fromPathname, rule.from) &&
      routeMatches(toPathname, rule.to),
  );

  return matchedRule?.kind ?? "fade";
}
