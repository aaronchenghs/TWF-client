import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { ToolTipWrapper } from "@/components/ToolTip/ToolTip";
import { APP_ICONS } from "@/lib/constants/icons";
import styles from "./DesktopTeaserHeader.module.scss";

const LANDING_TEASER_TOOLTIP = "Coming Soon...";
const TEASER_ICON_PROPS = {
  size: 16,
  strokeWidth: 2.5,
} as const;

const { playerName: PlayerNameIcon } = APP_ICONS;

export function DesktopTeaserHeader() {
  return (
    <div
      className={styles.desktopTeaserHeader}
      role="group"
      aria-label="Upcoming features"
    >
      <ToolTipWrapper content={LANDING_TEASER_TOOLTIP} placement="bottom">
        <button
          type="button"
          className={styles.desktopTeaserAction}
          aria-disabled="true"
          aria-label="Sign In, coming soon"
        >
          <PlayerNameIcon {...TEASER_ICON_PROPS} />
          <MainTextTypography
            variant="caption"
            weight="bold"
            className={styles.desktopTeaserLabel}
          >
            Sign In
          </MainTextTypography>
        </button>
      </ToolTipWrapper>

      <ToolTipWrapper content={LANDING_TEASER_TOOLTIP} placement="bottom">
        <button
          type="button"
          className={clsx(
            styles.desktopTeaserAction,
            styles.createTierSetButton,
          )}
          aria-disabled="true"
          aria-label="Create a tier set, coming soon"
        >
          <MainTextTypography
            variant="caption"
            weight="bold"
            className={styles.desktopTeaserLabel}
          >
            Create a Tier Set
          </MainTextTypography>
        </button>
      </ToolTipWrapper>
    </div>
  );
}
