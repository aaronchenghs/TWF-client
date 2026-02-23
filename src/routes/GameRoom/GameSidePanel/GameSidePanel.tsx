import clsx from "clsx";
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
  isIntro: boolean;
  roomCode: string;
  onExitClick: () => void;
  onPlayAgain: () => void;
  isRematchSubmitting: boolean;
};

export function GameSidePanel({
  state,
  isIntro,
  roomCode,
  onExitClick,
  onPlayAgain,
  isRematchSubmitting,
}: GameSidePanelProps) {
  return (
    <aside className={clsx(styles.sideSection, isIntro && styles.intro)}>
      <SidePanelHeader roomCode={roomCode} onExitClick={onExitClick} />

      <SubtextDivider />

      <PhaseStatusCard state={state} />
      <CurrentItemCard state={state} />
      <ActivePlayersCard state={state} />
      <FinishedCard
        phase={state.phase}
        onPlayAgain={onPlayAgain}
        isRematchSubmitting={isRematchSubmitting}
      />
    </aside>
  );
}
