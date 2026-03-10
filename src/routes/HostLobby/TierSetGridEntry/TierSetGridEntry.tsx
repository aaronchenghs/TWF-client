import styles from "./TierSetGridEntry.module.scss";
import clsx from "clsx";
import { useCallback, useId, useRef, useState } from "react";
import { MainTextTypography } from "../../../components/MainTextTypography/MainTextTypography";
import { roomSocket } from "../../../services/sockets/roomSocket";
import { TierSetDetails } from "./TierSetDetails/TierSetDetails";
import * as Contracts from "@twf/contracts";
import type { Guid } from "../../../lib/guid";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { handleKeyDown } from "@/lib/accessibility";
import { LoadableImage } from "../../../components/LoadableImage/LoadableImage";
import { getTierSetItemCountAccentColor } from "@/lib/tierItems";
import pluralize from "pluralize";
import { useStaggeredLoadImages } from "@/lib/hooks/useStaggeredLoad";

type TierSetSummary = Contracts.TierSetSummary;
type TierSetDefinition = Contracts.TierSetDefinition;

type TierSetGridEntryProps = {
  index: number;
  tierSet: TierSetSummary;
  selected: boolean;
  openDetailsTierSetId: Guid | null;
  setOpenDetailsTierSet: React.Dispatch<React.SetStateAction<Guid | null>>;
  onSelect: (tierSet: TierSetSummary) => void;
};

export function TierSetGridEntry({
  index,
  tierSet,
  selected,
  openDetailsTierSetId,
  setOpenDetailsTierSet,
  onSelect,
}: TierSetGridEntryProps) {
  const [details, setDetails] = useState<TierSetDefinition | null>(null);
  const { shouldLoad: shouldLoadPreview, loading: previewLoading } =
    useStaggeredLoadImages({ index });
  const detailsRequestRef = useRef<Promise<TierSetDefinition> | null>(null);
  const isDetailsOpen = openDetailsTierSetId === tierSet.id;
  const detailsRegionId = useId();

  const previewName = tierSet.firstItemName ?? tierSet.title;
  const previewImageSrc =
    tierSet.firstItemImageSrc ?? tierSet.coverImageSrc ?? undefined;
  const itemCount = tierSet.itemCount ?? 0;

  const itemCountLabel = `${itemCount} ${pluralize("item", itemCount)}`;
  const itemCountAccentColor = getTierSetItemCountAccentColor(itemCount);
  const itemCountBadgeStyle = {
    "--meta-accent": itemCountAccentColor,
    "--meta-surface": itemCountAccentColor.replace(")", " / 0.14)"),
  } as React.CSSProperties;
  const effectivePreviewSrc = shouldLoadPreview ? previewImageSrc : undefined;

  const loadDetails = useCallback(async () => {
    if (details) return details;
    if (detailsRequestRef.current) return detailsRequestRef.current;

    const request = roomSocket.getTierSet(tierSet.id);
    detailsRequestRef.current = request;

    try {
      const fullDetails = await request;
      setDetails(fullDetails);
      return fullDetails;
    } finally {
      detailsRequestRef.current = null;
    }
  }, [details, tierSet.id]);

  const toggleDetails = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (isDetailsOpen) {
        setOpenDetailsTierSet(null);
        return;
      }

      setOpenDetailsTierSet(tierSet.id as Guid);

      await loadDetails().catch(() => {});
    },
    [isDetailsOpen, loadDetails, setOpenDetailsTierSet, tierSet.id],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(styles.presetCard, selected && styles.presetCardSelected)}
      onClick={() => onSelect(tierSet)}
      onKeyDown={(e) =>
        handleKeyDown(e, () => {
          onSelect(tierSet);
        })
      }
      aria-pressed={selected}
    >
      <div className={styles.topRow}>
        <div className={styles.previewThumb}>
          <LoadableImage
            className={styles.previewImage}
            src={effectivePreviewSrc}
            alt={previewName}
            width={88}
            height={88}
            loading={previewLoading}
            decoding="async"
            fetchPriority="low"
            draggable={false}
            fallback={
              <div className={styles.previewPlaceholder} aria-hidden="true" />
            }
          />
        </div>

        <div className={styles.mainColumn}>
          <div className={styles.headerRow}>
            <div className={styles.titleGroup}>
              <MainTextTypography
                variant="h3"
                tone={selected ? "player" : undefined}
                className={styles.presetTitle}
              >
                {tierSet.title}
              </MainTextTypography>

              <span className={styles.metaBadge} style={itemCountBadgeStyle}>
                <MainTextTypography
                  variant="body"
                  weight="bold"
                  className={styles.metaText}
                >
                  {itemCountLabel}
                </MainTextTypography>
              </span>
            </div>

            <AccentButton
              type="button"
              size="small"
              onClick={toggleDetails}
              aria-expanded={isDetailsOpen}
              aria-controls={detailsRegionId}
            >
              <MainTextTypography variant="label" weight="bold">
                {isDetailsOpen ? "HIDE DETAILS" : "DETAILS"}
              </MainTextTypography>
            </AccentButton>
          </div>

          <MainTextTypography
            variant="body"
            muted
            className={styles.presetDescription}
          >
            {tierSet.description ?? "-"}
          </MainTextTypography>
        </div>
      </div>

      <div
        id={detailsRegionId}
        className={clsx(styles.collapse, isDetailsOpen && styles.open)}
      >
        <TierSetDetails isLoading={!details} details={details} />
      </div>
    </div>
  );
}
