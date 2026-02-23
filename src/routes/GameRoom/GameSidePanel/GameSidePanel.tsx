import clsx from "clsx";
import * as Contracts from "@twf/contracts";
import { SidePanelHeader } from "./SidePanelHeader/SidePanelHeader";
import { PhaseStatusCard } from "./PhaseStatusCard/PhaseStatusCard";
import { CurrentItemCard } from "./CurrentItemCard/CurrentItemCard";
import { ActivePlayersCard } from "./ActivePlayersCard/ActivePlayersCard";
import { FinishedCard } from "./FinishedCard/FinishedCard";
import styles from "./GameSidePanel.module.scss";

type RoomPublicState = Contracts.RoomPublicState;

type GameSidePanelProps = {
  state: RoomPublicState;
  isIntro: boolean;
  onExitClick: () => void;
  onPlayAgain: () => void;
  isRematchSubmitting: boolean;
};

export function GameSidePanel({
  state,
  isIntro,
  onExitClick,
  onPlayAgain,
  isRematchSubmitting,
}: GameSidePanelProps) {
  return (
    <aside className={clsx(styles.sideSection, isIntro && styles.intro)}>
      <SidePanelHeader onExitClick={onExitClick} />
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
