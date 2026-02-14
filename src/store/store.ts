import { configureStore } from "@reduxjs/toolkit";
import issueReportReducer from "./slices/issueReportSlice";
import snackbarReducer from "./slices/snackBarSlice";
import tipsPopupReducer from "./slices/tipsPopupSlice";
import userSettingsReducer from "./slices/userSettingsSlice";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";

export const store = configureStore({
  reducer: {
    issueReport: issueReportReducer,
    snackbar: snackbarReducer,
    tipsPopup: tipsPopupReducer,
    userSettings: userSettingsReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
