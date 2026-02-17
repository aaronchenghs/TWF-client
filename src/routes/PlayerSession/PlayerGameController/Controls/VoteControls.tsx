import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import pluralize from "pluralize";

type VoteValue = Contracts.VoteValue;

export function VoteControls(props: {
  disabled: boolean;
  alreadyVoted: boolean;
  isPlacer: boolean;
  onVote: (vote: VoteValue) => void;
  discussionSecondsLeft?: number;
}) {
  const {
    disabled,
    alreadyVoted,
    onVote,
    isPlacer,
    discussionSecondsLeft = 0,
  } = props;
  const isDiscussionLocked = discussionSecondsLeft > 0;

  if (isPlacer || alreadyVoted) return <AwaitingControls />;
  return (
    <div className={styles.controls}>
      {isDiscussionLocked ? (
        <div
          className={styles.discussionNotice}
          role="status"
          aria-live="polite"
        >
          <MainTextTypography
            variant="label"
            className={styles.discussionTitle}
            textAlign="center"
            letterSpacing="wide"
          >
            Discuss first
          </MainTextTypography>
          <MainTextTypography variant="body" textAlign="center">
            Voting unlocks in {pluralize("second", discussionSecondsLeft, true)}
            .
          </MainTextTypography>
        </div>
      ) : null}

      <div className={styles.grid3}>
        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(-1)}
          aria-label="Vote drift up"
        >
          Drift Up 👆
        </AccentButton>

        <AccentButton
          variant="primary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(0)}
          aria-label="Vote agree"
        >
          Agree 🤝
        </AccentButton>

        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(1)}
          aria-label="Vote drift down"
        >
          Drift Down 👇
        </AccentButton>
      </div>
    </div>
  );
}
