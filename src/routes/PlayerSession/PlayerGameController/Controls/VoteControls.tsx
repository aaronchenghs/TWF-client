import clsx from "clsx";
import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import pluralize from "pluralize";
import { APP_ICONS, ICON_PROPS } from "@/lib/icons";

type VoteValue = Contracts.VoteValue;
const {
  up: VoteUpIcon,
  agree: VoteAgreeIcon,
  down: VoteDownIcon,
} = APP_ICONS.vote;

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
  const voteButtonIconProps = ICON_PROPS.vote.controls;

  if (isPlacer || alreadyVoted) return <AwaitingControls />;
  return (
    <div className={clsx(styles.controls, styles.voteControls)}>
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
          <span className={styles.voteButtonContent}>
            <VoteUpIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            Drift Up
          </span>
        </AccentButton>

        <AccentButton
          variant="primary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(0)}
          aria-label="Vote agree"
        >
          <span className={styles.voteButtonContent}>
            <VoteAgreeIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            Agree
          </span>
        </AccentButton>

        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(1)}
          aria-label="Vote drift down"
        >
          <span className={styles.voteButtonContent}>
            <VoteDownIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            Drift Down
          </span>
        </AccentButton>
      </div>
    </div>
  );
}
