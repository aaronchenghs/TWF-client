import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./routes/Landing/Landing";
import HostLobby from "./routes/HostLobby/HostLobby";
import { ROUTES } from "./routes/routes";
import "./App.module.scss";
import PlayerLobby from "./routes/PlayerLobby/PlayerLobby";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<Landing />} />
        <Route path={`${ROUTES.HOST_LOBBY}/:code?`} element={<HostLobby />} />
        <Route path={`${ROUTES.ROOM}/:code?`} element={<PlayerLobby />} />
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
