import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useLocation } from "react-router-dom";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useMobileView } from "@/lib/hooks/useMobileView";
import { matchesRoutePath } from "@/routes/routes";
import { useAppSelector, type AppState } from "@/store/store";
import {
  getTipDelayMs,
  getTipDefinition,
  getTipKindForPath,
  getTipsToMarkSeenOnNavigation,
  hasTipBeenSeen,
  isTipVisibleForViewport,
  markTipSeen,
  type TipKind,
} from "./tipRegistry";
import styles from "./TipsPopupHost.module.scss";

/**
 * Global host for route-driven in-app tips.
 *
 * To add a new tip:
 * 1. Add a new key and definition to `tipRegistry.ts`.
 * 2. Set the tip's `route`, `delayMs`, viewport visibility, and any optional
 *    persistence rules there.
 * 3. If the tip should become permanently dismissed after navigation, add
 *    `markSeenOnNavigateTo` in the registry.
 * 4. The host will automatically show the matching route tip on entry.
 */
export function TipsPopupHost() {
  const ShowTipsIcon = APP_ICONS.showTips;
  const location = useLocation();
  const isMobile = useMobileView();

  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );
  const [activeTipKind, setActiveTipKind] = useState<TipKind | null>(null);
  const previousPathnameRef = useRef(location.pathname);

  useEffect(
    function markSeenTipsOnRouteNavigation() {
      const previousPathname = previousPathnameRef.current;
      const nextPathname = location.pathname;

      if (previousPathname === nextPathname) return;

      for (const tipKind of getTipsToMarkSeenOnNavigation(
        previousPathname,
        nextPathname,
      )) {
        markTipSeen(tipKind);
      }

      previousPathnameRef.current = nextPathname;
    },
    [location.pathname],
  );

  useEffect(
    function syncActiveRouteTip() {
      if (!$isShowTips) {
        setActiveTipKind(null);
        return;
      }

      const routeTipKind = getTipKindForPath(location.pathname);
      if (!routeTipKind) {
        setActiveTipKind(null);
        return;
      }

      if (hasTipBeenSeen(routeTipKind)) {
        setActiveTipKind(null);
        return;
      }

      if (!isTipVisibleForViewport(routeTipKind, isMobile)) {
        setActiveTipKind(null);
        return;
      }

      setActiveTipKind(null);

      const tipTimer = window.setTimeout(() => {
        setActiveTipKind(routeTipKind);
      }, getTipDelayMs(routeTipKind));

      return () => {
        window.clearTimeout(tipTimer);
      };
    },
    [location.pathname, isMobile, $isShowTips],
  );

  if (!activeTipKind || !$isShowTips) return null;

  const tip = getTipDefinition(activeTipKind);

  if (!matchesRoutePath(location.pathname, tip.route)) return null;
  if (hasTipBeenSeen(activeTipKind)) return null;
  if (!isTipVisibleForViewport(activeTipKind, isMobile)) return null;

  return (
    <div
      className={clsx(
        styles.host,
        isMobile ? styles.mobileHost : styles.desktopHost,
      )}
    >
      <aside className={styles.tip} role="status" aria-live="polite">
        <div className={styles.copy}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon} aria-hidden="true">
              <ShowTipsIcon {...ICON_PROPS.quickActions} aria-hidden />
            </span>
            <MainTextTypography variant="h6" className={styles.title}>
              {tip.title}
            </MainTextTypography>
          </div>

          <MainTextTypography variant="body" muted className={styles.message}>
            {tip.message}
          </MainTextTypography>
        </div>

        <AccentButton
          size="small"
          className={styles.action}
          onClick={() => {
            markTipSeen(activeTipKind);
            setActiveTipKind(null);
          }}
        >
          {tip.dismissLabel ?? "Got it"}
        </AccentButton>
      </aside>
    </div>
  );
}
