import { useEffect } from "react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentToggle } from "@/components/AccentToggle/AccentToggle";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { SettingsOptionRow } from "@/components/SettingsOptionRow/SettingsOptionRow";
import { LOCAL_STORAGE_KEYS, setLocalStorageValue } from "@/lib/localStorage";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import {
  closeSettingsModal,
  setReduceMotion,
  setShowTips,
} from "@/store/slices/userSettingsSlice";

export function SettingsModal() {
  const dispatch = useAppDispatch();
  const $isSettingsModalOpen = useAppSelector(
    (state: AppState) => state.userSettings.isSettingsModalOpen,
  );
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );

  useEffect(
    function syncReduceMotion() {
      setLocalStorageValue(
        LOCAL_STORAGE_KEYS.USER_REDUCE_MOTION,
        $isReduceMotion,
      );
    },
    [$isReduceMotion],
  );

  useEffect(
    function syncShowTips() {
      setLocalStorageValue(LOCAL_STORAGE_KEYS.USER_SHOW_TIPS, $isShowTips);
    },
    [$isShowTips],
  );

  return (
    <PrimaryModal
      open={$isSettingsModalOpen}
      onClose={() => dispatch(closeSettingsModal())}
      title="Settings"
      subtitle="Preferences"
      maxWidth={560}
      footer={
        <AccentButton onClick={() => dispatch(closeSettingsModal())}>
          Done
        </AccentButton>
      }
    >
      <SettingsOptionRow
        title="Reduce Motion"
        description="Reduces most animations and transitions across the app."
        control={
          <AccentToggle
            checked={$isReduceMotion}
            onChange={(nextValue) => dispatch(setReduceMotion(nextValue))}
            ariaLabel="Toggle reduce motion"
          />
        }
      />

      <SettingsOptionRow
        title="Show Tips"
        description="Shows gameplay tips and guidance popups."
        control={
          <AccentToggle
            checked={$isShowTips}
            onChange={(nextValue) => dispatch(setShowTips(nextValue))}
            ariaLabel="Toggle show tips"
          />
        }
      />
    </PrimaryModal>
  );
}
