import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import HostLobby from "@/routes/HostLobby/HostLobby";
import { RouteTransition } from "@/components/RouteTransition";
import { ROUTES } from "@/routes/routes";
import {
  getRouteTransitionDirection,
  type TransitionDirection,
} from "@/lib/routeTransitionRules";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback/RouteLoadingFallback";
import { usePendingRejoinSnackbar } from "@/lib/hooks/usePendingRejoinSnackbar";
import PlayerSession from "./routes/PlayerSession/PlayerSession";

const Landing = lazy(() => import("@/routes/Landing/Landing"));

const GameRoom = lazy(() => import("@/routes/GameRoom/GameRoom"));

export function AnimatedRoutes() {
  const location = useLocation();
  usePendingRejoinSnackbar(location.pathname);

  const [direction, setDirection] = useState<TransitionDirection>("left");
  const prevPathRef = useRef(location.pathname);

  useEffect(
    function determineTransitionDirection() {
      const from = prevPathRef.current;
      const to = location.pathname;
      setDirection(getRouteTransitionDirection(from, to));
      prevPathRef.current = location.pathname;
    },
    [location.pathname],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100svh",
        overflow: "hidden",
      }}
    >
      <RouteTransition routeKey={location.pathname} direction={direction}>
        <Routes location={location}>
          <Route
            path={ROUTES.LANDING}
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Landing />
              </Suspense>
            }
          />
          <Route path={ROUTES.HOST_LOBBY} element={<HostLobby />} />
          <Route
            path={ROUTES.GAME_ROOM}
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <GameRoom />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.PLAYER_SESSION}
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <PlayerSession />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
      </RouteTransition>
    </div>
  );
}
