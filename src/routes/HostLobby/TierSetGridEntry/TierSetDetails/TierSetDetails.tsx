import type { TierSetDefinition } from "@twf/contracts";
import styles from "./TierSetDetails.module.scss";
import { MainTextTypography } from "../../../../components/MainTextTypography/MaintTextTypography";

type TierSetDetailsProps = {
  isLoading: boolean;
  errorMessage: string | null;
  details: TierSetDefinition | null;
};

export function TierSetDetails({
  isLoading,
  errorMessage,
  details,
}: TierSetDetailsProps) {
  return (
    <div className={styles.detailsBody} onClick={(e) => e.stopPropagation()}>
      {isLoading && (
        <MainTextTypography variant="body" muted>
          Loading…
        </MainTextTypography>
      )}

      {errorMessage && (
        <MainTextTypography variant="body">{errorMessage}</MainTextTypography>
      )}

      {details && (
        <>
          <div className={styles.detailsSection}>
            <MainTextTypography variant="h5">Tiers</MainTextTypography>
            <div className={styles.tierChips}>
              {details.tiers.map((tier) => (
                <span key={tier.id} className={styles.tierChip}>
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
                  {item.imageSrc ? (
                    <img
                      className={styles.itemThumb}
                      src={item.imageSrc}
                      alt={item.name}
                    />
                  ) : (
                    <div className={styles.itemThumbPlaceholder} />
                  )}
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
