import { configureStore } from "@reduxjs/toolkit";
import snackbarReducer from "./slices/snackBarSlice";
import userSettingsReducer from "./slices/userSettingsSlice";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";

export const store = configureStore({
  reducer: {
    snackbar: snackbarReducer,
    userSettings: userSettingsReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
