import { BrowserRouter } from "react-router-dom";
import "./App.module.scss";
import { SnackbarHost } from "@/components/Snackbar/Snackbar";
import { AnimatedRoutes } from "@/AnimatedRoutes";

export default function App() {
  return (
    <>
      <SnackbarHost />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </>
  );
}
