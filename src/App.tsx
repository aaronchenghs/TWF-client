import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./routes/Landing/Landing";
import HostLobby from "./routes/HostLobby/HostLobby";
import { ROUTES } from "./routes/routes";
import "./App.module.scss";
import PlayerLobby from "./routes/PlayerLobby/PlayerLobby";
import GameRoom from "./routes/GameRoom/GameRoom";
import PlayerGameController from "./routes/PlayerGameController/PlayerGameController";
import { SnackbarHost } from "./components/Snackbar/Snackbar";

export default function App() {
  return (
    <>
      <SnackbarHost />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LANDING} element={<Landing />} />
          <Route path={`${ROUTES.HOST_LOBBY}/:code?`} element={<HostLobby />} />
          <Route
            path={`${ROUTES.PLAYER_LOBBY}/:code?`}
            element={<PlayerLobby />}
          />
          <Route path={`${ROUTES.GAME_ROOM}/:code`} element={<GameRoom />} />
          <Route
            path={`${ROUTES.PLAYER_GAME_CONTROLLER}/:code?`}
            element={<PlayerGameController />}
          />
          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
