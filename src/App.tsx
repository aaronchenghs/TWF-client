import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.module.scss";
import { SnackbarHost } from "@/components/Snackbar/Snackbar";
import { AnimatedRoutes } from "@/AnimatedRoutes";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { TipsPopupHost } from "@/components/TipsPopupHost/TipsPopupHost";
import { useAppSelector, type AppState } from "@/store/store";

export default function App() {
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );

  useEffect(
    function syncReduceMotionDataset() {
      document.documentElement.dataset.reduceMotion = $isReduceMotion
        ? "true"
        : "false";
    },
    [$isReduceMotion],
  );

  return (
    <>
      <SnackbarHost />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      <SettingsModal />
      <TipsPopupHost />
    </>
  );
}
