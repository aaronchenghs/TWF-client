import { lazy, Suspense, useLayoutEffect, useState } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import HostLobby from "@/routes/HostLobby/HostLobby";
import { RouteTransition } from "@/components/RouteTransition";
import { ROUTES } from "@/routes/routes";
import {
  getRouteTransitionKind,
  type TransitionKind,
} from "@/lib/routeTransitionRules";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback/RouteLoadingFallback";
import { usePendingRejoinSnackbar } from "@/lib/hooks/usePendingRejoinSnackbar";
import PlayerSession from "./routes/PlayerSession/PlayerSession";

const Landing = lazy(() => import("@/routes/Landing/Landing"));

const GameRoom = lazy(() => import("@/routes/GameRoom/GameRoom"));

export function AnimatedRoutes() {
  const location = useLocation();
  usePendingRejoinSnackbar(location.pathname);

  const [displayLocation, setDisplayLocation] = useState(location);
  const [pendingLocation, setPendingLocation] = useState(location);
  const [kind, setKind] = useState<TransitionKind>("fade");

  useLayoutEffect(
    function determineTransitionKind() {
      if (location.pathname === displayLocation.pathname) return;

      setKind(
        getRouteTransitionKind(displayLocation.pathname, location.pathname),
      );
      setPendingLocation(location);
    },
    [displayLocation.pathname, location],
  );

  useLayoutEffect(
    function commitPendingLocationOnNextFrame() {
      if (pendingLocation.pathname === displayLocation.pathname) return;

      const rafId = window.requestAnimationFrame(() => {
        setDisplayLocation(pendingLocation);
      });

      return () => window.cancelAnimationFrame(rafId);
    },
    [displayLocation.pathname, pendingLocation],
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
      <RouteTransition routeKey={displayLocation.pathname} kind={kind}>
        <Routes location={displayLocation}>
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
