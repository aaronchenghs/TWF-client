import * as Contracts from "@twf/contracts";
import { CreatorMessageButton } from "@/components/CreatorMessageButton/CreatorMessageButton";
import { ShareResultsButton } from "@/components/ShareResultsButton/ShareResultsButton";
import styles from "./FinishedUtilityActions.module.scss";

type RoomPublicState = Contracts.RoomPublicState;

type FinishedUtilityActionsProps = {
  state: RoomPublicState;
};

export function FinishedUtilityActions({
  state,
}: FinishedUtilityActionsProps) {
  return (
    <div className={styles.actionsRow}>
      <ShareResultsButton state={state} />
      <CreatorMessageButton />
    </div>
  );
}
