import { useState } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { APP_VERSION } from "@/config/env";
import { LicensingModal } from "@/components/LicensingModal/LicensingModal";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./VersionTagButton.module.scss";
import { VERSION_TAG_VISIBLE_ROUTE_PATTERNS } from "@/routes/routes";

const CURRENT_YEAR = new Date().getFullYear();
const VERSION_TAG_TEXT = `Copyright ${CURRENT_YEAR} ARC v${APP_VERSION}`;

export function VersionTagButton() {
  const [isLicensingOpen, setIsLicensingOpen] = useState<boolean>(false);
  const { pathname } = useLocation();
  const shouldRender = VERSION_TAG_VISIBLE_ROUTE_PATTERNS.some(
    (pattern) => matchPath({ path: pattern, end: true }, pathname) !== null,
  );

  if (!shouldRender) return null;

  return (
    <>
      <button
        type="button"
        className={styles.versionTagButton}
        onClick={() => setIsLicensingOpen(true)}
        aria-label={`${VERSION_TAG_TEXT}, open licensing information`}
      >
        <MainTextTypography
          className={styles.versionTag}
          variant="caption"
          letterSpacing="wide"
          muted
        >
          {VERSION_TAG_TEXT}
        </MainTextTypography>
      </button>

      <LicensingModal
        open={isLicensingOpen}
        onClose={() => setIsLicensingOpen(false)}
      />
    </>
  );
}
