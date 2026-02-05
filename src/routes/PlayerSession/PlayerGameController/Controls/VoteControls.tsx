import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../components/AccentButton/AccentButton";

type VoteValue = Contracts.VoteValue;

export function VoteControls(props: {
  disabled: boolean;
  alreadyVoted: boolean;
  isPlacer: boolean;
  onVote: (vote: VoteValue) => void;
}) {
  const { disabled, alreadyVoted, onVote, isPlacer } = props;

  if (isPlacer || alreadyVoted) return <AwaitingControls />;
  return (
    <div className={styles.controls}>
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
