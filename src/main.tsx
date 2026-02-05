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
