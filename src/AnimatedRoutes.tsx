import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { RouteTransition } from "@/components/RouteTransition";
import { ROUTES } from "@/routes/routes";
import {
  getRouteTransitionDirection,
  type TransitionDirection,
} from "@/lib/routeTransitionRules";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback/RouteLoadingFallback";

const Landing = lazy(() => import("@/routes/Landing/Landing"));
const HostLobby = lazy(() => import("@/routes/HostLobby/HostLobby"));
const PlayerSession = lazy(() => import("@/routes/PlayerSession/PlayerSession"));
const GameRoom = lazy(() => import("@/routes/GameRoom/GameRoom"));

export function AnimatedRoutes() {
  const location = useLocation();
  const [direction, setDirection] = useState<TransitionDirection>("left");
  const prevPathRef = useRef(location.pathname);

  useEffect(
    function determineTransitionDirection() {
      const from = prevPathRef.current;
      const to = location.pathname;
      setDirection(getRouteTransitionDirection(from, to));
      prevPathRef.current = to;
    },
    [location.pathname],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <Suspense fallback={<RouteLoadingFallback />}>
        <RouteTransition routeKey={location.pathname} direction={direction}>
          <Routes location={location}>
            <Route path={ROUTES.LANDING} element={<Landing />} />
            <Route path={`${ROUTES.HOST_LOBBY}/:code`} element={<HostLobby />} />
            <Route
              path={`${ROUTES.PLAYER_SESSION}/:code`}
              element={<PlayerSession />}
            />
            <Route path={`${ROUTES.GAME_ROOM}/:code`} element={<GameRoom />} />
            <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
          </Routes>
        </RouteTransition>
      </Suspense>
    </div>
  );
}
