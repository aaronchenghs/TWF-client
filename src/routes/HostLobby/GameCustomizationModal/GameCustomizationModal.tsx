import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentToggle } from "@/components/AccentToggle/AccentToggle";
import { GroupedButtonOptions } from "@/components/GroupedButtonOptions/GroupedButtonOptions";
import { ModalHeaderTitle } from "@/components/ModalHeaderTitle/ModalHeaderTitle";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { SettingsOptionRow } from "@/components/SettingsModal/SettingsOptionRow/SettingsOptionRow";
import {
  areGameCustomizationSettingsDefault,
  DEFAULT_GAME_CUSTOMIZATION_SETTINGS,
  GAME_SETTING_TOGGLE_DEFINITIONS,
  GAME_SETTING_TIMING_DEFINITIONS,
  updateGameCustomizationSetting,
  type GameCustomizationSettings,
} from "@/lib/gameSettings";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import styles from "./GameCustomizationModal.module.scss";

type GameCustomizationModalProps = {
  open: boolean;
  settings: GameCustomizationSettings;
  onClose: () => void;
  onChange: (nextSettings: GameCustomizationSettings) => void;
};

const {
  gameSettings: GameCustomizationTitleIcon,
  itemNames: ItemNamesIcon,
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
  const isResetDisabled = areGameCustomizationSettingsDefault(settings);

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
      contentClassName={styles.content}
      footer={<AccentButton onClick={onClose}>Done</AccentButton>}
    >
      <div className={styles.actions}>
        <AccentButton
          variant="secondary"
          size="small"
          disabled={isResetDisabled}
          onClick={() => onChange(DEFAULT_GAME_CUSTOMIZATION_SETTINGS)}
        >
          <span className={styles.resetButtonContent}>
            <ResetIcon {...iconProps} aria-hidden="true" />
            <span>Reset to Default</span>
          </span>
        </AccentButton>
      </div>

      <div className={styles.rows}>
        {GAME_SETTING_TIMING_DEFINITIONS.map((setting) => (
          <SettingsOptionRow
            key={setting.key}
            layout="stacked"
            icon={<TimerIcon {...iconProps} />}
            title={setting.title}
            description={setting.description}
            control={
              <GroupedButtonOptions
                ariaLabel={setting.ariaLabel}
                options={setting.options}
                value={settings[setting.key]}
                onChange={(nextValue) =>
                  onChange(
                    updateGameCustomizationSetting(
                      settings,
                      setting.key,
                      nextValue,
                    ),
                  )
                }
              />
            }
          />
        ))}

        {GAME_SETTING_TOGGLE_DEFINITIONS.map((setting) => (
          <SettingsOptionRow
            key={setting.key}
            icon={<ItemNamesIcon {...iconProps} />}
            title={setting.title}
            description={setting.description}
            control={
              <AccentToggle
                checked={settings[setting.key]}
                onChange={(nextValue) =>
                  onChange(
                    updateGameCustomizationSetting(
                      settings,
                      setting.key,
                      nextValue,
                    ),
                  )
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
