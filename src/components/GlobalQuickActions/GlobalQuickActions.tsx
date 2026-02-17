import { ExpandingIconButton } from "@/components/ExpandingIconButton/ExpandingIconButton";
import { openIssueReportForm } from "@/lib/openIssueReportForm";
import { useAppDispatch } from "@/store/store";
import { openSettingsModal } from "@/store/slices/userSettingsSlice";
import styles from "./GlobalQuickActions.module.scss";
import { APP_ICONS, ICON_PROPS } from "@/lib/icons";

const { settings: SettingsIcon, reportIssue: ReportIssueIcon } = APP_ICONS;

export function GlobalQuickActions() {
  const dispatch = useAppDispatch();
  const iconProps = ICON_PROPS.quickActions;

  return (
    <div className={styles.quickActions}>
      <ExpandingIconButton
        icon={<SettingsIcon {...iconProps} aria-hidden="true" />}
        label="Settings"
        onClick={() => dispatch(openSettingsModal())}
        expandDirection="right"
      />
      <ExpandingIconButton
        icon={<ReportIssueIcon {...iconProps} aria-hidden="true" />}
        label="Report Issue"
        onClick={openIssueReportForm}
        expandDirection="right"
      />
    </div>
  );
}
