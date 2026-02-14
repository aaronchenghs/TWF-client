import { useEffect } from "react";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { markHostLobbyPlayTipSeen } from "@/lib/session";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import {
  hideTip,
  TIP_KINDS,
} from "@/store/slices/tipsPopupSlice";
import styles from "./TipsPopupHost.module.scss";

export function TipsPopupHost() {
  const dispatch = useAppDispatch();
  const $activeTipKind = useAppSelector(
    (state: AppState) => state.tipsPopup.activeTipKind,
  );
  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );

  useEffect(
    function hideTipWhenDisabled() {
      if ($isShowTips) return;
      if (!$activeTipKind) return;
      dispatch(hideTip());
    },
    [$activeTipKind, $isShowTips, dispatch],
  );

  if (!$activeTipKind || !$isShowTips) return null;

  if ($activeTipKind === TIP_KINDS.HOST_LOBBY_BEST_PLAY) {
    return (
      <aside className={styles.tip} role="status" aria-live="polite">
        <MainTextTypography variant="h6" className={styles.title}>
          💡Best way to play
        </MainTextTypography>

        <MainTextTypography variant="body" muted>
          Host on a big screen or screen-share, and have everyone join with
          this room's code on their own phone or device. You can still play by
          joining from your phone or a second tab!
        </MainTextTypography>

        <AccentButton
          size="small"
          onClick={() => {
            markHostLobbyPlayTipSeen();
            dispatch(hideTip());
          }}
        >
          Got it
        </AccentButton>
      </aside>
    );
  }

  return null;
}
