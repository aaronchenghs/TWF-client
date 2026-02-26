import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { LOCAL_STORAGE_KEYS, getLocalStorageValue } from "@/lib/localStorage";
import { clamp01 } from "@/lib/sounds/soundEffects";

type UserSettingsState = {
  isSettingsModalOpen: boolean;
  isReduceMotion: boolean;
  isShowTips: boolean;
  isHighContrast: boolean;
  isStreamerMode: boolean;
  sfxVolume: number;
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
  sfxVolume: (() => {
    const storedVolume = getLocalStorageValue(
      LOCAL_STORAGE_KEYS.USER_SFX_VOLUME,
    );
    return typeof storedVolume === "number" ? clamp01(storedVolume) : 1;
  })(),
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
    setSfxVolume: (state, action: PayloadAction<number>) => {
      state.sfxVolume = clamp01(action.payload);
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
  setSfxVolume,
} = userSettingsSlice.actions;

export default userSettingsSlice.reducer;
