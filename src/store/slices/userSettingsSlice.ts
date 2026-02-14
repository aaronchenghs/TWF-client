import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { LOCAL_STORAGE_KEYS, getLocalStorageValue } from "@/lib/localStorage";

type UserSettingsState = {
  isSettingsModalOpen: boolean;
  isReduceMotion: boolean;
  isShowTips: boolean;
};

const initialState: UserSettingsState = {
  isSettingsModalOpen: false,
  isReduceMotion:
    getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_REDUCE_MOTION) === true,
  isShowTips: getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_SHOW_TIPS) !== false,
};

export const userSettingsSlice = createSlice({
  name: "userSettings",
  initialState,
  reducers: {
    openSettingsModal: (state) => {
      state.isSettingsModalOpen = true;
    },
    closeSettingsModal: (state) => {
      state.isSettingsModalOpen = false;
    },
    setReduceMotion: (state, action: PayloadAction<boolean>) => {
      state.isReduceMotion = action.payload;
    },
    setShowTips: (state, action: PayloadAction<boolean>) => {
      state.isShowTips = action.payload;
    },
  },
});

export const {
  openSettingsModal,
  closeSettingsModal,
  setReduceMotion,
  setShowTips,
} =
  userSettingsSlice.actions;

export default userSettingsSlice.reducer;
