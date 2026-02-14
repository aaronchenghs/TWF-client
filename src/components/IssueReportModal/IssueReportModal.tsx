import { useEffect, useMemo, useState } from "react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { submitIssueReport, openIssueReport } from "@/lib/issueReport";
import { ISSUES_API_URL } from "@/config/env";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import {
  closeIssueReportModal,
  setIssueReportSubmitting,
} from "@/store/slices/issueReportSlice";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import styles from "./IssueReportModal.module.scss";

const MIN_DETAILS_CHARS = 8;

export function IssueReportModal() {
  const dispatch = useAppDispatch();
  const $isIssueReportModalOpen = useAppSelector(
    (state: AppState) => state.issueReport.isIssueReportModalOpen,
  );
  const $isSubmitting = useAppSelector(
    (state: AppState) => state.issueReport.isSubmitting,
  );

  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");

  useEffect(
    function resetFieldsOnOpen() {
      if (!$isIssueReportModalOpen) return;
      setSummary("");
      setDetails("");
    },
    [$isIssueReportModalOpen],
  );

  const detailsLength = useMemo(() => details.trim().length, [details]);
  const isSubmitDisabled = useMemo(
    () => detailsLength < MIN_DETAILS_CHARS || $isSubmitting,
    [detailsLength, $isSubmitting],
  );

  const handleSubmit = async () => {
    const context = { summary, details };

    if (ISSUES_API_URL) {
      dispatch(setIssueReportSubmitting(true));
      try {
        await submitIssueReport(context);
        dispatch(closeIssueReportModal());
        dispatch(
          pushSnackbar({
            message: "Your bug report has been submitted. Thank you!",
            severity: "success",
          }),
        );
      } catch {
        dispatch(setIssueReportSubmitting(false));
        dispatch(
          pushSnackbar({
            message: "Failed to submit bug report. Please try again.",
            severity: "error",
          }),
        );
      }
    } else {
      openIssueReport(context);
      dispatch(closeIssueReportModal());
    }
  };

  return (
    <PrimaryModal
      open={$isIssueReportModalOpen}
      onClose={() => dispatch(closeIssueReportModal())}
      title="Report an Issue"
      maxWidth={620}
      footer={
        <>
          <AccentButton
            variant="secondary"
            disabled={$isSubmitting}
            onClick={() => dispatch(closeIssueReportModal())}
          >
            Cancel
          </AccentButton>
          <AccentButton disabled={isSubmitDisabled} onClick={handleSubmit}>
            {$isSubmitting ? "Submitting…" : "Submit"}
          </AccentButton>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <MainTextTypography variant="caption" muted>
            Summary (optional)
          </MainTextTypography>
          <input
            type="text"
            className={styles.input}
            maxLength={120}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short title for the issue"
            disabled={$isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <MainTextTypography variant="caption" muted>
            What happened?
          </MainTextTypography>
          <textarea
            className={styles.textarea}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the problem and steps to reproduce"
            rows={8}
            disabled={$isSubmitting}
          />
          <MainTextTypography
            variant="caption"
            muted={isSubmitDisabled}
            className={styles.counter}
          >
            {detailsLength}/{MIN_DETAILS_CHARS} characters minimum
          </MainTextTypography>
        </label>
      </div>
    </PrimaryModal>
  );
}
