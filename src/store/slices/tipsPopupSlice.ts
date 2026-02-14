import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const TIP_KINDS = {
  HOST_LOBBY_BEST_PLAY: "host_lobby_best_play",
} as const;

export type TipKind = (typeof TIP_KINDS)[keyof typeof TIP_KINDS];

type TipsPopupState = {
  activeTipKind: TipKind | null;
};

const initialState: TipsPopupState = {
  activeTipKind: null,
};

export const tipsPopupSlice = createSlice({
  name: "tipsPopup",
  initialState,
  reducers: {
    showTip: (state, action: PayloadAction<TipKind>) => {
      state.activeTipKind = action.payload;
    },
    hideTip: (state) => {
      state.activeTipKind = null;
    },
    hideTipByKind: (state, action: PayloadAction<TipKind>) => {
      if (state.activeTipKind === action.payload) {
        state.activeTipKind = null;
      }
    },
  },
});

export const { showTip, hideTip, hideTipByKind } = tipsPopupSlice.actions;

export default tipsPopupSlice.reducer;
