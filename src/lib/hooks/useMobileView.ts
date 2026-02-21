import { useEffect, useState } from "react";

const MOBILE_WIDTH = 768;

type UseMobileViewOptions = {
  breakpoint?: number;
  /** initial value during SSR/hydration; default false */
  defaultValue?: boolean;
};

/** Determines if the current window size is mobile based on a breakpoint. */
export function useMobileView(options: UseMobileViewOptions = {}): boolean {
  const { breakpoint = MOBILE_WIDTH, defaultValue = false } = options;

  const query = `(max-width: ${breakpoint}px)`;

  const getMatches = () => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return defaultValue;
    return window.matchMedia(query).matches;
  };

  const [isMobileView, setIsMobileView] = useState<boolean>(getMatches);

  useEffect(
    function listenWindowResize() {
      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      )
        return;
      const mql = window.matchMedia(query);
      const onChange = () => setIsMobileView(mql.matches);

      onChange();

      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
      } else {
        mql.addListener(onChange);
        return () => mql.removeListener(onChange);
      }
    },
    [query, defaultValue],
  );

  return isMobileView;
}
