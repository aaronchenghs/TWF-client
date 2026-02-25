import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { LOCAL_STORAGE_KEYS, getLocalStorageValue } from "@/lib/localStorage";

type UserSettingsState = {
  isSettingsModalOpen: boolean;
  isReduceMotion: boolean;
  isShowTips: boolean;
  isHighContrast: boolean;
  isStreamerMode: boolean;
  isSoundEnabled: boolean;
};

const initialState: UserSettingsState = {
  isSettingsModalOpen: false,
  isReduceMotion:
    getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_REDUCE_MOTION) === true,
  isShowTips: getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_SHOW_TIPS) !== false,
  isHighContrast:
    getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_HIGH_CONTRAST) === true,
  isStreamerMode:
    getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_STREAMER_MODE) === true,
  isSoundEnabled:
    getLocalStorageValue(LOCAL_STORAGE_KEYS.USER_SOUND_EFFECTS) !== false,
};

const userSettingsSlice = createSlice({
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
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.isHighContrast = action.payload;
    },
    setStreamerMode: (state, action: PayloadAction<boolean>) => {
      state.isStreamerMode = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.isSoundEnabled = action.payload;
    },
  },
});

export const {
  openSettingsModal,
  closeSettingsModal,
  setReduceMotion,
  setShowTips,
  setHighContrast,
  setStreamerMode,
  setSoundEnabled,
} = userSettingsSlice.actions;

export default userSettingsSlice.reducer;
