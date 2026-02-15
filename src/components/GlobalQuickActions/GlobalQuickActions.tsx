import { Bug, Settings } from "lucide-react";
import { ExpandingIconButton } from "@/components/ExpandingIconButton/ExpandingIconButton";
import { openIssueReportForm } from "@/lib/openIssueReportForm";
import { useAppDispatch } from "@/store/store";
import { openSettingsModal } from "@/store/slices/userSettingsSlice";
import styles from "./GlobalQuickActions.module.scss";

export function GlobalQuickActions() {
  const dispatch = useAppDispatch();

  return (
    <div className={styles.quickActions}>
      <ExpandingIconButton
        icon={<Settings aria-hidden="true" />}
        label="Settings"
        onClick={() => dispatch(openSettingsModal())}
        expandDirection="right"
      />
      <ExpandingIconButton
        icon={<Bug aria-hidden="true" />}
        label="Report Issue"
        onClick={openIssueReportForm}
        expandDirection="right"
      />
    </div>
  );
}
