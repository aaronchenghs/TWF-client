/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { BrowserRouter } from "react-router-dom";
import "./App.scss";
import { SnackbarHost } from "@/components/Snackbar/Snackbar";
import { AnimatedRoutes } from "@/AnimatedRoutes";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { TipsPopupHost } from "@/components/TipsPopupHost/TipsPopupHost";
import { useUserSettingsSync } from "@/lib/hooks/useUserSettingsSync";
import { useRouteSeo } from "@/lib/hooks/useRouteSeo";
import { GlobalQuickActions } from "@/components/GlobalQuickActions/GlobalQuickActions";
import { BackgroundGridEffect } from "@/components/BackgroundGridEffect/BackgroundGridEffect";
import { VersionTagButton } from "@/components/VersionTagButton/VersionTagButton";
import { BackendStoppedBanner } from "@/components/BackendStoppedBanner/BackendStoppedBanner";

function SeoManager() {
  useRouteSeo();
  return null;
}

export default function App() {
  useUserSettingsSync();

  return (
    <>
      <BackgroundGridEffect />
      <BackendStoppedBanner />
      <SnackbarHost />

      <BrowserRouter>
        <SeoManager />

        <AnimatedRoutes />

        <GlobalQuickActions />
        <VersionTagButton />
        <TipsPopupHost />
      </BrowserRouter>

      <SettingsModal />
    </>
  );
}
