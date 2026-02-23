import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { RoomCodeDisplay } from "@/components/RoomCodeDisplay/RoomCodeDisplay";
import styles from "./SidePanelHeader.module.scss";

type SidePanelHeaderProps = {
  roomCode: string;
  onExitClick: () => void;
};

export function SidePanelHeader({
  roomCode,
  onExitClick,
}: SidePanelHeaderProps) {
  return (
    <header className={styles.header}>
      <TWFLogo className={styles.logo} aria-hidden="true" />
      <RoomCodeDisplay roomCode={roomCode} variant="h4" muted />
      <AccentButton
        className={styles.exitButton}
        variant="secondary"
        onClick={onExitClick}
      >
        Exit
      </AccentButton>
    </header>
  );
}
