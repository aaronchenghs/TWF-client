import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./routes/Landing/Landing";
import Display from "./routes/Display";
import Controller from "./routes/Controller";
import { ROUTES } from "./routes/routes";
import "./styles/App.module.scss";
import "./styles/global.scss";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<Landing />} />
        <Route path={`${ROUTES.DISPLAY}/:code?`} element={<Display />} />
        <Route path={`${ROUTES.CONTROLLER}/:code?`} element={<Controller />} />
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
