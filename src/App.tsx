import { BrowserRouter } from "react-router-dom";
import "./App.module.scss";
import { SnackbarHost } from "@/components/Snackbar/Snackbar";
import { AnimatedRoutes } from "@/AnimatedRoutes";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { TipsPopupHost } from "@/components/TipsPopupHost/TipsPopupHost";
import { useUserSettingsSync } from "@/lib/hooks/useUserSettingsSync";
import { useRouteSeo } from "@/lib/hooks/useRouteSeo";

function SeoManager() {
  useRouteSeo();
  return null;
}

export default function App() {
  useUserSettingsSync();

  return (
    <>
      <SnackbarHost />
      <BrowserRouter>
        <SeoManager />
        <AnimatedRoutes />
      </BrowserRouter>
      <SettingsModal />
      <TipsPopupHost />
    </>
  );
}
