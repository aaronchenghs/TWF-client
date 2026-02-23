import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import styles from "./SidePanelHeader.module.scss";

type SidePanelHeaderProps = {
  onExitClick: () => void;
};

export function SidePanelHeader({ onExitClick }: SidePanelHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <TWFLogo className={styles.logo} aria-hidden="true" />
      </div>

      <div className={styles.headerRight}>
        <AccentButton variant="secondary" onClick={onExitClick}>
          Exit
        </AccentButton>
      </div>
    </header>
  );
}
