/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "@/App";
import { store } from "@/store/store";
import { initSocketErrorToasts as initSocketErrorHandler } from "@/lib/errorHandling";

// Initialized in main to avoid StrictMode and Hot-Reload double-invoking issues
const disposeSocketErrorToasts = initSocketErrorHandler();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeSocketErrorToasts();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
