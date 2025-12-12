import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./routes/Landing";
import Display from "./routes/Display";
import Controller from "./routes/Controller";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/display/:code?" element={<Display />} />
        <Route path="/controller/:code?" element={<Controller />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
