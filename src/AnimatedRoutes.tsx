import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { RouteTransition } from "@/components/RouteTransition";
import { ROUTES } from "@/routes/routes";
import {
  getRouteTransitionDirection,
  type TransitionDirection,
} from "@/lib/routeTransitionRules";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback/RouteLoadingFallback";
import {
  consumePendingRejoinNotice,
  type RejoinNotice,
} from "@/lib/session";
import { useAppDispatch } from "@/store/store";
import { pushSnackbar } from "@/store/slices/snackBarSlice";

const Landing = lazy(() => import("@/routes/Landing/Landing"));
const HostLobby = lazy(() => import("@/routes/HostLobby/HostLobby"));
const PlayerSession = lazy(
  () => import("@/routes/PlayerSession/PlayerSession"),
);
const GameRoom = lazy(() => import("@/routes/GameRoom/GameRoom"));

export function AnimatedRoutes() {
  const location = useLocation();
  const dispatch = useAppDispatch();
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

  useEffect(
    function showPendingRejoinNotice() {
      let handled = false;

      const showNotice = (notice: RejoinNotice) => {
        const title =
          notice.kind === "host_lobby" ? "Rejoin Your Lobby" : "Rejoin Your Game";
        const message =
          notice.kind === "player"
            ? "Enter the room code again with any name to rejoin."
            : notice.kind === "host_lobby"
              ? `Reconnect as host in lobby ${notice.roomCode}.`
              : `Reconnect as host in game ${notice.roomCode}.`;

        dispatch(
          pushSnackbar({
            severity: "info",
            title,
            message,
          }),
        );
      };

      const consumeAndShow = () => {
        if (handled) return;
        const notice = consumePendingRejoinNotice();
        if (!notice) return;
        handled = true;
        showNotice(notice);
      };

      consumeAndShow();
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        consumeAndShow();
        if (handled || attempts >= 8) {
          window.clearInterval(timer);
        }
      }, 50);

      return () => {
        window.clearInterval(timer);
      };
    },
    [dispatch, location.pathname],
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
          <Route
            path={`${ROUTES.HOST_LOBBY}/:code`}
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <HostLobby />
              </Suspense>
            }
          />
          <Route
            path={`${ROUTES.PLAYER_SESSION}/:code`}
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <PlayerSession />
              </Suspense>
            }
          />
          <Route
            path={`${ROUTES.GAME_ROOM}/:code`}
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <GameRoom />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
      </RouteTransition>
    </div>
  );
}
