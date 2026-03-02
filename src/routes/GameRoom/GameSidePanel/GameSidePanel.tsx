import * as Contracts from "@twf/contracts";
import { SidePanelHeader } from "./SidePanelHeader/SidePanelHeader";
import { PhaseStatusCard } from "./PhaseStatusCard/PhaseStatusCard";
import { CurrentItemCard } from "./CurrentItemCard/CurrentItemCard";
import { ActivePlayersCard } from "./ActivePlayersCard/ActivePlayersCard";
import { FinishedCard } from "./FinishedCard/FinishedCard";
import styles from "./GameSidePanel.module.scss";
import { SubtextDivider } from "@/components/SubtextDivider/SubtextDivider";

type RoomPublicState = Contracts.RoomPublicState;

type GameSidePanelProps = {
  state: RoomPublicState;
  roomCode: string;
  onExitClick: () => void;
  onPlayAgain: () => void;
  isRematchSubmitting: boolean;
};

export function GameSidePanel({
  state,
  roomCode,
  onExitClick,
  onPlayAgain,
  isRematchSubmitting,
}: GameSidePanelProps) {
  return (
    <aside className={styles.sideSection}>
      <SidePanelHeader roomCode={roomCode} onExitClick={onExitClick} />

      <SubtextDivider />

      <PhaseStatusCard state={state} />
      <CurrentItemCard state={state} />
      <ActivePlayersCard state={state} />
      <FinishedCard
        state={state}
        onPlayAgain={onPlayAgain}
        isRematchSubmitting={isRematchSubmitting}
      />
    </aside>
  );
}
