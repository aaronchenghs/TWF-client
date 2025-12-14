import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./routes/Landing/Landing";
import Display from "./routes/Display";
import Controller from "./routes/Controller";
import { ROUTES } from "./routes/routes";
import "./App.module.scss";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<Landing />} />
        <Route path="/display/:code?" element={<Display />} />
        <Route path="/controller/:code?" element={<Controller />} />
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
