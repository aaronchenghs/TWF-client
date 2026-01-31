import { useEffect, useRef, useState } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { RouteTransition } from "./components/RouteTransition";
import { ROUTES } from "./routes/routes";
import Landing from "./routes/Landing/Landing";
import HostLobby from "./routes/HostLobby/HostLobby";
import PlayerSession from "./routes/PlayerSession/PlayerSession";
import GameRoom from "./routes/GameRoom/GameRoom";
import {
  getRouteTransitionDirection,
  type TransitionDirection,
} from "./lib/routeTransitionRules";

export function AnimatedRoutes() {
  const location = useLocation();
  const [direction, setDirection] = useState<TransitionDirection>("left");
  const prevPathRef = useRef(location.pathname);

  useEffect(
    function determineTransitionDirection() {
      const from = prevPathRef.current;
      const to = location.pathname;
      setDirection(getRouteTransitionDirection(from, to, "left"));
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
    </div>
  );
}
