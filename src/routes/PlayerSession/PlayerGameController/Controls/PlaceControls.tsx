import { useMemo, useState } from "react";
import clsx from "clsx";
import styles from "./Controls.module.scss";
import { AwaitingControls } from "./AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../../../components/MainTextTypography/MainTextTypography";
type Tier = Contracts.Tier;
type TierItem = Contracts.TierItem;

export function PlaceControls(props: {
  tiers: Tier[];
  tierOrder: string[];
  disabled: boolean;
  onPlace: (tierId: string) => void;
  currentItem: TierItem | null;
}) {
  const { tiers, tierOrder, disabled, onPlace, currentItem } = props;

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const itemName = currentItem?.name ?? "";
  const itemImageSrc = currentItem?.imageSrc ?? null;

  const tierById = useMemo(() => {
    const m = new Map<string, Tier>();
    for (const t of tiers) m.set(t.id, t);
    return m;
  }, [tiers]);

  const orderedTierIds = useMemo(() => {
    const base = tierOrder.length ? tierOrder : tiers.map((t) => t.id);
    return base.filter((id) => tierById.has(id));
  }, [tierOrder, tiers, tierById]);

  if (disabled) return <AwaitingControls />;

  const isConfirmDisabled = !selectedTierId;

  return (
    <div className={styles.controls}>
      <div className={styles.controlsHeader}>
        <div className={styles.controlsHeaderLeft}>
          <MainTextTypography variant="label" muted letterSpacing="wide">
            TAP A TIER
          </MainTextTypography>
        </div>
      </div>

      <div
        className={styles.tierPickList}
        role="group"
        aria-label="Choose a tier to place into"
      >
        {orderedTierIds.map((tierId) => {
          const tier = tierById.get(tierId)!;
          const isSelected = selectedTierId === tierId;

          return (
            <button
              key={tierId}
              type="button"
              className={clsx(
                styles.tierPickRow,
                isSelected && styles.tierPickRowSelected,
              )}
              style={{
                ["--tierColor" as string]: tier.color,
              }}
              onClick={() => setSelectedTierId(tierId)}
              aria-pressed={isSelected}
            >
              <div className={styles.tierPickLabel}>
                <MainTextTypography variant="h5" weight="bold">
                  {tier.name ?? tierId}
                </MainTextTypography>
              </div>

              <div className={styles.tierPickPreview}>
                {isSelected ? (
                  itemImageSrc ? (
                    <img
                      className={styles.previewImg}
                      src={itemImageSrc}
                      alt={
                        itemName
                          ? `${itemName} preview`
                          : "Selected item preview"
                      }
                      loading="eager"
                      draggable={false}
                    />
                  ) : (
                    <div className={styles.previewFallback} aria-hidden="true">
                      <MainTextTypography variant="h4">
                        {(itemName || "?").slice(0, 1).toUpperCase()}
                      </MainTextTypography>
                    </div>
                  )
                ) : (
                  <div
                    className={styles.previewPlaceholder}
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.confirmRow}>
        <AccentButton
          variant="primary"
          className={styles.confirmButton}
          disabled={isConfirmDisabled || !currentItem}
          onClick={() => {
            if (!selectedTierId || !currentItem) return;
            onPlace(selectedTierId);
          }}
        >
          Confirm
        </AccentButton>
      </div>
    </div>
  );
}
