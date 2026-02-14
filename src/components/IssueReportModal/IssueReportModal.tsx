import { useEffect, useMemo, useState } from "react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PrimaryModal } from "@/components/PrimaryModal/PrimaryModal";
import { openIssueReport } from "@/lib/issueReport";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import { closeIssueReportModal } from "@/store/slices/issueReportSlice";
import styles from "./IssueReportModal.module.scss";

const MIN_DETAILS_CHARS = 8;

export function IssueReportModal() {
  const dispatch = useAppDispatch();
  const $isIssueReportModalOpen = useAppSelector(
    (state: AppState) => state.issueReport.isIssueReportModalOpen,
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
    () => detailsLength < MIN_DETAILS_CHARS,
    [detailsLength],
  );

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
            onClick={() => dispatch(closeIssueReportModal())}
          >
            Cancel
          </AccentButton>
          <AccentButton
            disabled={isSubmitDisabled}
            onClick={() => {
              openIssueReport({
                summary,
                details,
              });
              dispatch(closeIssueReportModal());
            }}
          >
            Submit
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
