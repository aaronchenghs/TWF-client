import { BrowserRouter } from "react-router-dom";
import "./App.module.scss";
import { SnackbarHost } from "@/components/Snackbar/Snackbar";
import { AnimatedRoutes } from "@/AnimatedRoutes";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { TipsPopupHost } from "@/components/TipsPopupHost/TipsPopupHost";
import { useUserSettingsSync } from "@/lib/hooks/useUserSettingsSync";

export default function App() {
  useUserSettingsSync();

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
