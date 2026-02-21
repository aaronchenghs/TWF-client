import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentToggle } from "@/components/AccentToggle/AccentToggle";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { SettingsOptionRow } from "@/components/SettingsOptionRow/SettingsOptionRow";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import {
  closeSettingsModal,
  setHighContrast,
  setReduceMotion,
  setShowTips,
} from "@/store/slices/userSettingsSlice";
import styles from "./SettingsModal.module.scss";
import { APP_ICONS, ICON_PROPS } from "@/lib/icons";

const {
  reduceMotion: ReduceMotionIcon,
  highContrast: HighContrastIcon,
  showTips: ShowTipsIcon,
} = APP_ICONS;

export function SettingsModal() {
  const dispatch = useAppDispatch();
  const iconProps = ICON_PROPS.settingsRow;
  const $isSettingsModalOpen = useAppSelector(
    (state: AppState) => state.userSettings.isSettingsModalOpen,
  );
  const $isReduceMotion = useAppSelector(
    (state: AppState) => state.userSettings.isReduceMotion,
  );
  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );
  const $isHighContrast = useAppSelector(
    (state: AppState) => state.userSettings.isHighContrast,
  );

  return (
    <PrimaryModal
      open={$isSettingsModalOpen}
      onClose={() => dispatch(closeSettingsModal())}
      title="Settings"
      maxWidth={560}
      footer={
        <AccentButton onClick={() => dispatch(closeSettingsModal())}>
          Done
        </AccentButton>
      }
    >
      <div className={styles.rows}>
        <SettingsOptionRow
          icon={<ReduceMotionIcon {...iconProps} />}
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
          icon={<HighContrastIcon {...iconProps} />}
          title="High Contrast"
          description="Boosts contrast for readability and visual clarity."
          control={
            <AccentToggle
              checked={$isHighContrast}
              onChange={(nextValue) => dispatch(setHighContrast(nextValue))}
              ariaLabel="Toggle high contrast mode"
            />
          }
        />

        <SettingsOptionRow
          icon={<ShowTipsIcon {...iconProps} />}
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
      </div>
    </PrimaryModal>
  );
}
