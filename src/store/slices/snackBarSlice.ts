import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { newGuid, type Guid } from "../../lib/guid";

export type SnackbarSeverity = "error" | "warn" | "info" | "success";

export type SnackbarItem = {
  id: Guid;
  message: string;
  title?: string;
  severity: SnackbarSeverity;
  durationMs: number | null;
  createdAt: number;
};

const DEFAULT_DURATION_MS = 4500;
const MAX_ITEMS = 3;

type PushSnackbarPayload = {
  message: string;
  title?: string;
  severity?: SnackbarSeverity;
  durationMs?: number | null;
  id?: Guid;
};

type SnackbarState = {
  items: SnackbarItem[];
};

const initialState: SnackbarState = {
  items: [],
};

export const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    pushSnackbar: (state, action: PayloadAction<PushSnackbarPayload>) => {
      const { id, severity, durationMs } = action.payload;

      const item: SnackbarItem = {
        ...action.payload,
        id: id ?? newGuid(),
        severity: severity ?? "error",
        durationMs: durationMs === undefined ? DEFAULT_DURATION_MS : durationMs,
        createdAt: Date.now(),
      };

      state.items.unshift(item);
      if (state.items.length > MAX_ITEMS) state.items.length = MAX_ITEMS;
    },
    dismissSnackbar: (state, action: PayloadAction<Guid>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearSnackbars: (state) => {
      state.items = [];
    },
  },
});

export const { pushSnackbar, dismissSnackbar, clearSnackbars } =
  snackbarSlice.actions;
export default snackbarSlice.reducer;
