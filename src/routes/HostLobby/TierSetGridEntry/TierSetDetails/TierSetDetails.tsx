import styles from "./TierSetDetails.module.scss";
import { MainTextTypography } from "../../../../components/MainTextTypography/MainTextTypography";
import * as Contracts from "@twf/contracts";
import { LoadableImage } from "../../../../components/LoadableImage/LoadableImage";
import { handleKeyDown } from "@/lib/accessibility";
type TierSetDefinition = Contracts.TierSetDefinition;

type TierSetDetailsProps = {
  isLoading: boolean;
  details: TierSetDefinition | null;
};

export function TierSetDetails({ isLoading, details }: TierSetDetailsProps) {
  return (
    <div
      className={styles.detailsBody}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => handleKeyDown(e, () => {}, { stopPropagation: true })}
      tabIndex={-1}
      role="button"
    >
      {isLoading && (
        <MainTextTypography variant="body" muted>
          Loading…
        </MainTextTypography>
      )}

      {details && (
        <>
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
            <MainTextTypography variant="h5">
              Items ({details.items.length})
            </MainTextTypography>
            <div className={styles.itemsList}>
              {details.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <LoadableImage
                    src={item.imageSrc}
                    alt={item.name}
                    loading="lazy"
                    draggable={false}
                    fallback={<div aria-hidden="true" />}
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
}
