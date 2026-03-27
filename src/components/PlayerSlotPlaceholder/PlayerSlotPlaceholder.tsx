import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import styles from "./PlayerSlotPlaceholder.module.scss";

type PlayerSlotPlaceholderProps = {
  className?: string;
};

export function PlayerSlotPlaceholder({
  className,
}: PlayerSlotPlaceholderProps) {
  return (
    <div
      className={clsx(styles.root, className)}
      aria-label="Open player slot"
      role="presentation"
    >
      <div className={styles.identity}>
        <PlayerAvatar avatar={null} size={45} className={styles.avatar} />
        <MainTextTypography variant="h4" muted className={styles.label}>
          Open Slot
        </MainTextTypography>
      </div>
    </div>
  );
}
