import { ExpandingIconButton } from "@/components/ExpandingIconButton/ExpandingIconButton";
import { useAppDispatch } from "@/store/store";
import { openSettingsModal } from "@/store/slices/userSettingsSlice";
import styles from "./GlobalQuickActions.module.scss";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { matchPath, useLocation } from "react-router-dom";
import { QUICK_ACTIONS_HIDDEN_ROUTE_PATTERNS } from "@/routes/routes";

const { settings: SettingsIcon } = APP_ICONS;

export function GlobalQuickActions() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const iconProps = ICON_PROPS.quickActions;
  const areQuickActionsHidden = QUICK_ACTIONS_HIDDEN_ROUTE_PATTERNS.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null,
  );

  if (areQuickActionsHidden) return null;

  return (
    <div className={styles.quickActions}>
      <ExpandingIconButton
        icon={<SettingsIcon {...iconProps} role="presentation" />}
        label="Settings"
        onClick={() => dispatch(openSettingsModal())}
        expandDirection="left"
      />
    </div>
  );
}
