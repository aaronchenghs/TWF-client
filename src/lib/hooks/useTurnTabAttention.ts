import { useEffect, useRef } from "react";
import { TAB_TITLES } from "@/lib/tabTitles";

const ALERT_TITLE = TAB_TITLES.TURN_ALERT;
const ALERT_BLINK_MS = 1000;

export function useTurnTabAttention({ isMyTurn }: { isMyTurn: boolean }) {
  const previousIsMyTurnRef = useRef(false);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldShowAlertTitleRef = useRef(false);
  const restoreTitleRef = useRef<string | null>(null);

  useEffect(
    function listenForVisibility() {
      function clearAttention() {
        if (blinkIntervalRef.current) {
          clearInterval(blinkIntervalRef.current);
          blinkIntervalRef.current = null;
        }

        if (
          restoreTitleRef.current &&
          document.title !== restoreTitleRef.current
        )
          document.title = restoreTitleRef.current;

        restoreTitleRef.current = null;
        shouldShowAlertTitleRef.current = false;
      }

      function startAttention() {
        if (blinkIntervalRef.current) return;

        restoreTitleRef.current = document.title;
        shouldShowAlertTitleRef.current = true;

        document.title = ALERT_TITLE;

        blinkIntervalRef.current = setInterval(() => {
          const fallbackTitle = restoreTitleRef.current ?? TAB_TITLES.APP_NAME;
          shouldShowAlertTitleRef.current = !shouldShowAlertTitleRef.current;
          document.title = shouldShowAlertTitleRef.current
            ? ALERT_TITLE
            : fallbackTitle;
        }, ALERT_BLINK_MS);
      }

      const turnStartedWhileHidden =
        isMyTurn &&
        !previousIsMyTurnRef.current &&
        document.visibilityState === "hidden";

      previousIsMyTurnRef.current = isMyTurn;

      if (turnStartedWhileHidden) startAttention();

      if (!isMyTurn) clearAttention();

      function handleVisibilityChange() {
        if (document.visibilityState === "visible") clearAttention();
      }

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        if (!isMyTurn || document.visibilityState === "visible")
          clearAttention();
      };
    },
    [isMyTurn],
  );
}
