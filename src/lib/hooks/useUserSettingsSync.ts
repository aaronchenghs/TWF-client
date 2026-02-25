import { useEffect } from "react";
import { LOCAL_STORAGE_KEYS, setLocalStorageValue } from "@/lib/localStorage";
import { useAppSelector, type AppState } from "@/store/store";

export function useUserSettingsSync() {
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const $isHighContrast = useAppSelector(
    (state: AppState) => state.userSettings.isHighContrast,
  );
  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );
  const $isStreamerMode = useAppSelector(
    (state: AppState) => state.userSettings.isStreamerMode,
  );
  const $isSoundEnabled = useAppSelector(
    (state: AppState) => state.userSettings.isSoundEnabled,
  );

  useEffect(
    function syncReduceMotionDataset() {
      document.documentElement.dataset.reduceMotion = $isReduceMotion
        ? "true"
        : "false";
    },
    [$isReduceMotion],
  );

  useEffect(
    function syncThemeMode() {
      document.documentElement.dataset.theme = $isHighContrast
        ? "contrast"
        : "dark";
    },
    [$isHighContrast],
  );

  useEffect(
    function persistReduceMotionSetting() {
      setLocalStorageValue(
        LOCAL_STORAGE_KEYS.USER_REDUCE_MOTION,
        $isReduceMotion,
      );
    },
    [$isReduceMotion],
  );

  useEffect(
    function persistHighContrastSetting() {
      setLocalStorageValue(
        LOCAL_STORAGE_KEYS.USER_HIGH_CONTRAST,
        $isHighContrast,
      );
    },
    [$isHighContrast],
  );

  useEffect(
    function persistShowTipsSetting() {
      setLocalStorageValue(LOCAL_STORAGE_KEYS.USER_SHOW_TIPS, $isShowTips);
    },
    [$isShowTips],
  );

  useEffect(
    function persistStreamerModeSetting() {
      setLocalStorageValue(
        LOCAL_STORAGE_KEYS.USER_STREAMER_MODE,
        $isStreamerMode,
      );
    },
    [$isStreamerMode],
  );

  useEffect(
    function persistSoundEffectsSetting() {
      setLocalStorageValue(
        LOCAL_STORAGE_KEYS.USER_SOUND_EFFECTS,
        $isSoundEnabled,
      );
    },
    [$isSoundEnabled],
  );
}
