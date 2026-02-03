import clsx from "clsx";
import styles from "./TierItemTile.module.scss";
import { MainTextTypography } from "../../../../components/MainTextTypography/MaintTextTypography";
import { getItemMeta } from "../../../../lib/tierItems";
import * as Contracts from "@twf/contracts";
import { LoadableImage } from "../../../../components/LoadableImage/LoadableImage";
type RoomPublicState = Contracts.RoomPublicState;
type TierItemId = Contracts.TierItemId;

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
        <LoadableImage
          className={styles.thumbImg}
          src={imageSrc}
          alt={name}
          loading="lazy"
          draggable={false}
          fallback={
            <div className={styles.thumbPlaceholder} aria-hidden="true">
              {name.slice(0, 1).toUpperCase()}
            </div>
          }
        />
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
