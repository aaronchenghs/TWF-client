import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../../../components/MainTextTypography/MaintTextTypography";
type VoteValue = Contracts.VoteValue;

export function VoteControls(props: {
  disabled: boolean;
  alreadyVoted: boolean;
  isPlacer: boolean;
  onVote: (vote: VoteValue) => void;
}) {
  const { disabled, alreadyVoted, onVote, isPlacer } = props;

  if (isPlacer) return <AwaitingControls />;
  return (
    <div className={styles.controls}>
      <MainTextTypography
        variant="label"
        muted
        letterSpacing="wide"
        className={styles.controlsLabel}
      >
        {`VOTE: `}
      </MainTextTypography>

      {isPlacer ? (
        <MainTextTypography variant="body" muted className={styles.smallNote}>
          You placed this item.
        </MainTextTypography>
      ) : alreadyVoted ? (
        <MainTextTypography variant="body" muted className={styles.smallNote}>
          Vote submitted.
        </MainTextTypography>
      ) : null}

      <div className={styles.grid3}>
        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(-1)}
        >
          Drift Up 👆
        </AccentButton>

        <AccentButton
          variant="primary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(0)}
        >
          Agree 🤝
        </AccentButton>

        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => onVote(1)}
        >
          Drift Down 👇
        </AccentButton>
      </div>
    </div>
  );
}
