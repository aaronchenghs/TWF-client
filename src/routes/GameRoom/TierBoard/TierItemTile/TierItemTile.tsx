import clsx from "clsx";
import styles from "./TierItemTile.module.scss";
import type { RoomPublicState, TierItemId } from "@twf/contracts";
import { MainTextTypography } from "../../../../components/MainTextTypography/MaintTextTypography";
import { getItemMeta } from "../../../../lib/tierItems";

type Props = {
  state: RoomPublicState;
  itemId: TierItemId;
  ghost?: boolean;
  className?: string;
};

export function TierItemTile({ state, itemId, ghost, className }: Props) {
  const { name, imageSrc } = getItemMeta(state, itemId);
  return (
    <div
      className={clsx(styles.itemTile, ghost && styles.ghost, className)}
      title={name}
    >
      <div className={styles.thumb}>
        {imageSrc ? (
          <img
            className={styles.thumbImg}
            src={imageSrc}
            alt={name}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <MainTextTypography
        variant="body"
        weight="bold"
        className={styles.itemName}
      >
        {name}
      </MainTextTypography>
    </div>
  );
}
