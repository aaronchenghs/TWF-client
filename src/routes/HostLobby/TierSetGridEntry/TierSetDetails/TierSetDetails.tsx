import styles from "./TierSetDetails.module.scss";
import { MainTextTypography } from "../../../../components/MainTextTypography/MainTextTypography";
import type { TierSetDefinition } from "@twf/contracts";
import { LoadableImage } from "../../../../components/LoadableImage/LoadableImage";

type TierSetDetailsProps = {
  isLoading: boolean;
  details: TierSetDefinition | null;
};

export function TierSetDetails({ isLoading, details }: TierSetDetailsProps) {
  /* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Scrollable details region needs keyboard focus for overflow content. */
  return (
    <div
      className={styles.detailsBody}
      role="region"
      aria-label="Tier set details"
      tabIndex={0}
    >
      {isLoading && (
        <MainTextTypography variant="body" muted>
          Loading...
        </MainTextTypography>
      )}

      {details && (
        <>
          {details.description && (
            <div className={styles.detailsSection}>
              <MainTextTypography variant="body" muted>
                {details.description}
              </MainTextTypography>
            </div>
          )}

          <div className={styles.detailsSection}>
            <MainTextTypography variant="h5">Tiers</MainTextTypography>
            <div className={styles.tierChips}>
              {details.tiers.map((tier) => (
                <span
                  key={tier.id}
                  className={styles.tierChip}
                  style={{ borderColor: tier.color }}
                >
                  {tier.name}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.detailsSection}>
            <MainTextTypography variant="h5">Items</MainTextTypography>
            <div className={styles.itemsList}>
              {details.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <LoadableImage
                    className={styles.itemImage}
                    src={item.imageSrc}
                    alt={item.name}
                    loading="lazy"
                    draggable={false}
                    fallback={
                      <div
                        aria-hidden="true"
                        className={styles.itemImageFallback}
                      />
                    }
                  />
                  <MainTextTypography
                    variant="body"
                    className={styles.itemText}
                  >
                    {item.name}
                  </MainTextTypography>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-tabindex */
}
