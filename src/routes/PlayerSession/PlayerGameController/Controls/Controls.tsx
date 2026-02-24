import * as Contracts from "@twf/contracts";
import { AwaitingControls } from "./AwaitingControls/AwaitingControls";
import PlaceControls from "./PlaceControls/PlaceControls";
import VoteControls from "./VoteControls/VoteControls";
import { FinishedControls } from "./FinishedControls/FinishedControls";
import styles from "../PlayerGameController.module.scss";

type RoomPublicState = Contracts.RoomPublicState;
type TierSetDefinition = Contracts.TierSetDefinition;
type TierItem = Contracts.TierItem;
type VoteValue = Contracts.VoteValue;

type PhaseControlsProps = {
  state: RoomPublicState;
  tierSet: TierSetDefinition | null;
  currentItem: TierItem | null;
  isMyTurn: boolean;
  canVote: boolean;
  myVote: VoteValue | null;
  hasConfirmedVote: boolean;
};

export function Controls({
  state,
  tierSet,
  currentItem,
  isMyTurn,
  canVote,
  myVote,
  hasConfirmedVote,
}: PhaseControlsProps) {
  const content = (() => {
    switch (state.phase) {
      case "PLACE":
        return (
          <PlaceControls
            phase={state.phase}
            tiers={tierSet?.tiers ?? []}
            tierOrder={state.tierOrder}
            currentItem={currentItem}
            isMyTurn={isMyTurn}
          />
        );

      case "VOTE":
        return (
          <VoteControls
            state={state}
            canVote={canVote}
            myVote={myVote}
            hasConfirmedVote={hasConfirmedVote}
            isPlacer={isMyTurn}
          />
        );

      case "FINISHED":
        return <FinishedControls phase={state.phase} />;

      default:
        return <AwaitingControls />;
    }
  })();

  return <footer className={styles.actionBar}>{content}</footer>;
}
