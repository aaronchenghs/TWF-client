import { useMemo, useState } from "react";
import clsx from "clsx";
import baseStyles from "../Controls.module.scss";
import styles from "./PlaceControls.module.scss";
import { AwaitingControls } from "../AwaitingControls/AwaitingControls";
import type { Tier, TierItem, RoomPublicState } from "@twf/contracts";
import { AccentButton } from "../../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../../../../components/MainTextTypography/MainTextTypography";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useActionLocks } from "@/lib/hooks/useActionLocks";
import { socketClient } from "@/services/sockets/socketClient";
import { useMobileView } from "@/lib/hooks/useMobileView";

type ActionLockKey = "place";

const ACTION_LOCK_TIMEOUT_MS = 6000;

type PlaceControlsProps = {
  tiers: Tier[];
  tierOrder: string[];
  phase: RoomPublicState["phase"];
  isMyTurn: boolean;
  currentItem: TierItem | null;
};

export function PlaceControls({
  tiers,
  tierOrder,
  phase,
  isMyTurn,
  currentItem,
}: PlaceControlsProps) {
  const isMobile = useMobileView();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const shouldRemainLockedByKey = useMemo<Record<ActionLockKey, boolean>>(
    () => ({
      place: phase === "PLACE" && isMyTurn,
    }),
    [phase, isMyTurn],
  );

  const actionLocks = useActionLocks(shouldRemainLockedByKey, {
    timeoutMs: ACTION_LOCK_TIMEOUT_MS,
  });

  const isPlacing = actionLocks.isLocked("place");
  const placeButtonIconProps = ICON_PROPS.place.controls;
  const buttonLabelVariant = isMobile ? "h2" : "h3";
  const ConfirmIcon = APP_ICONS.place.confirm;
  const PassIcon = APP_ICONS.place.pass;

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

  if (phase !== "PLACE" || !isMyTurn || isPlacing) return <AwaitingControls />;

  const isConfirmDisabled = !selectedTierId;

  const handlePlaceIntoTier = (tierId: string) => {
    if (phase !== "PLACE" || !isMyTurn) return;
    if (isPlacing) return;
    if (!socketClient.isConnected()) return;

    actionLocks.lock("place");
    try {
      socketClient.emit("game:place", { tierId });
    } catch {
      actionLocks.unlock("place");
    }
  };

  const handlePassTurn = () => {
    if (phase !== "PLACE" || !isMyTurn) return;
    if (isPlacing) return;
    if (!socketClient.isConnected()) return;

    actionLocks.lock("place");
    try {
      socketClient.emit("game:pass");
    } catch {
      actionLocks.unlock("place");
    }
  };

  return (
    <div className={clsx(baseStyles.controls, styles.placeControls)}>
      <div
        className={styles.tierPickList}
        role="group"
        aria-label="Choose a tier to place into"
      >
        {orderedTierIds.map((tierId) => {
          const tier = tierById.get(tierId);
          if (!tier) return null;
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
                <MainTextTypography
                  variant="h4"
                  weight="bold"
                  textAlign="center"
                  className={styles.tierPickLabelText}
                >
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
          variant="secondary"
          className={styles.passButton}
          onClick={handlePassTurn}
        >
          <span className={styles.actionButtonContent}>
            <PassIcon
              className={styles.actionButtonIcon}
              {...placeButtonIconProps}
              aria-hidden
            />
            <MainTextTypography variant={buttonLabelVariant}>
              PASS
            </MainTextTypography>
          </span>
        </AccentButton>
        <AccentButton
          variant="primary"
          className={styles.confirmButton}
          disabled={isConfirmDisabled || !currentItem}
          onClick={() => {
            if (!selectedTierId || !currentItem) return;
            handlePlaceIntoTier(selectedTierId);
          }}
        >
          <span className={styles.actionButtonContent}>
            <ConfirmIcon
              className={styles.actionButtonIcon}
              {...placeButtonIconProps}
              aria-hidden
            />
            <MainTextTypography variant={buttonLabelVariant}>
              CONFIRM
            </MainTextTypography>
          </span>
        </AccentButton>
      </div>
    </div>
  );
}

export default PlaceControls;
