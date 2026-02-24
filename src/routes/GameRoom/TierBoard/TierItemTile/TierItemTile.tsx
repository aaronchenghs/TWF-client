import { memo, useRef } from "react";
import clsx from "clsx";
import styles from "./TierItemTile.module.scss";
import { MainTextTypography } from "../../../../components/MainTextTypography/MainTextTypography";
import { getItemMeta } from "../../../../lib/tierItems";
import * as Contracts from "@twf/contracts";
import { LoadableImage } from "../../../../components/LoadableImage/LoadableImage";
import { useAutoFitText } from "../../../../lib/hooks/useAutoFitText";
type RoomPublicState = Contracts.RoomPublicState;
type TierItemId = Contracts.TierItemId;

type Props = {
  state: RoomPublicState;
  itemId: TierItemId;
  ghost?: boolean;
  isGhostSolidifying?: boolean;
  className?: string;
};

export const TierItemTile = memo(function TierItemTile({
  state,
  itemId,
  ghost,
  isGhostSolidifying,
  className,
}: Props) {
  const { name, imageSrc } = getItemMeta(state, itemId);
  const itemNameRef = useRef<HTMLSpanElement | null>(null);

  useAutoFitText(itemNameRef, {
    minFontSizePx: 16,
    watch: name,
  });

  return (
    <div
      className={clsx(
        styles.itemTile,
        ghost && styles.ghost,
        ghost && !isGhostSolidifying && styles.ghostPreview,
        ghost && isGhostSolidifying && styles.ghostSolidifying,
        className,
      )}
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
        textAlign="center"
        className={styles.itemName}
        ref={itemNameRef}
      >
        {name}
      </MainTextTypography>
    </div>
  );
});
