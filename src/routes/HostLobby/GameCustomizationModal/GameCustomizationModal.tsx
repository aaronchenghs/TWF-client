import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentToggle } from "@/components/AccentToggle/AccentToggle";
import { ModalHeaderTitle } from "@/components/ModalHeaderTitle/ModalHeaderTitle";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { SettingsOptionRow } from "@/components/SettingsModal/SettingsOptionRow/SettingsOptionRow";
import {
  areGameSettingsDefault,
  DEFAULT_GAME_SETTINGS,
  GAME_SETTING_TOGGLE_DEFINITIONS,
  updateGameSetting,
  type GameSettings,
} from "@/lib/gameSettings";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import styles from "./GameCustomizationModal.module.scss";

type GameCustomizationModalProps = {
  open: boolean;
  settings: GameSettings;
  onClose: () => void;
  onChange: (nextSettings: GameSettings) => void;
};

const {
  gameSettings: GameCustomizationTitleIcon,
  timer: TimerIcon,
  reset: ResetIcon,
} = APP_ICONS;

export function GameCustomizationModal({
  open,
  settings,
  onClose,
  onChange,
}: GameCustomizationModalProps) {
  const iconProps = ICON_PROPS.settingsRow;
  const isResetDisabled = areGameSettingsDefault(settings);

  return (
    <PrimaryModal
      open={open}
      onClose={onClose}
      title={
        <ModalHeaderTitle icon={<GameCustomizationTitleIcon />}>
          Customization
        </ModalHeaderTitle>
      }
      maxWidth={560}
      footer={<AccentButton onClick={onClose}>Done</AccentButton>}
    >
      <div className={styles.actions}>
        <AccentButton
          variant="secondary"
          size="small"
          disabled={isResetDisabled}
          onClick={() => onChange(DEFAULT_GAME_SETTINGS)}
        >
          <span className={styles.resetButtonContent}>
            <ResetIcon {...iconProps} aria-hidden="true" />
            <span>Reset to Default</span>
          </span>
        </AccentButton>
      </div>

      <div className={styles.rows}>
        {GAME_SETTING_TOGGLE_DEFINITIONS.map((setting) => (
          <SettingsOptionRow
            key={setting.key}
            icon={<TimerIcon {...iconProps} />}
            title={setting.title}
            description={setting.description}
            control={
              <AccentToggle
                checked={settings[setting.key]}
                onChange={(nextValue) =>
                  onChange(updateGameSetting(settings, setting.key, nextValue))
                }
                ariaLabel={setting.ariaLabel}
              />
            }
          />
        ))}
      </div>
    </PrimaryModal>
  );
}
