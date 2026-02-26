import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentToggle } from "@/components/AccentToggle/AccentToggle";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { SettingsOptionRow } from "./SettingsOptionRow/SettingsOptionRow";
import { SliderControl } from "./SliderControl/SliderControl";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import {
  closeSettingsModal,
  setHighContrast,
  setReduceMotion,
  setSfxVolume,
  setShowTips,
  setStreamerMode,
} from "@/store/slices/userSettingsSlice";
import styles from "./SettingsModal.module.scss";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { playSfx, setSoundEffectsVolume } from "@/lib/sounds/soundEffects";
import { useMobileView } from "@/lib/hooks/useMobileView";

const {
  reduceMotion: ReduceMotionIcon,
  highContrast: HighContrastIcon,
  showTips: ShowTipsIcon,
  streamerMode: StreamerModeIcon,
  soundEffects: SoundEffectsIcon,
} = APP_ICONS;

export function SettingsModal() {
  const dispatch = useAppDispatch();
  const isMobile = useMobileView();

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
  const $isStreamerMode = useAppSelector(
    (state: AppState) => state.userSettings.isStreamerMode,
  );
  const $sfxVolume = useAppSelector(
    (state: AppState) => state.userSettings.sfxVolume,
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
        {!isMobile && (
          <SettingsOptionRow
            icon={<SoundEffectsIcon {...iconProps} />}
            title="Sound Effects"
            description="Controls volume for lobby sound cues."
            layout="stacked"
            control={
              <SliderControl
                ariaLabel="Sound effects volume"
                valuePercent={Math.round($sfxVolume * 100)}
                onChangePercent={(nextPercent) => {
                  const nextVolume = nextPercent / 100;
                  setSoundEffectsVolume(nextVolume);
                  dispatch(setSfxVolume(nextVolume));
                }}
                onCommit={() => {
                  playSfx("ui.preview");
                }}
              />
            }
          />
        )}

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

        <SettingsOptionRow
          icon={<StreamerModeIcon {...iconProps} />}
          title="Streamer Mode"
          description="Hides room codes across the app by replacing them with ****."
          control={
            <AccentToggle
              checked={$isStreamerMode}
              onChange={(nextValue) => dispatch(setStreamerMode(nextValue))}
              ariaLabel="Toggle streamer mode"
            />
          }
        />
      </div>
    </PrimaryModal>
  );
}
