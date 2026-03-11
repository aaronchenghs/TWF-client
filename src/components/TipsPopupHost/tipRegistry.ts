import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageValue,
  setLocalStorageValue,
  type AppLocalStorageKey,
} from "@/lib/localStorage";
import { ROUTES, matchesRoutePath, type RoutePath } from "@/routes/routes";

type TipVisibility = "all" | "mobile" | "desktop";

type TipPersistence = {
  isSeen: () => boolean;
  markSeen: () => void;
};

const TIP_KINDS = {
  HOST_LOBBY_BEST_PLAY: "host_lobby_best_play",
  LANDING_MOBILE_JOIN_GUIDE: "landing_mobile_join_guide",
} as const;

export type TipKind = (typeof TIP_KINDS)[keyof typeof TIP_KINDS];

export type TipDefinition = {
  route: RoutePath;
  title: string;
  message: string;
  dismissLabel?: string;
  delayMs?: number;
  visibility: TipVisibility;
  markSeenOnNavigateTo?: RoutePath[];
  persistence?: TipPersistence;
};

const TIP_ORDER = Object.values(TIP_KINDS) as TipKind[];

const TIP_DEFINITIONS: Record<TipKind, TipDefinition> = {
  [TIP_KINDS.HOST_LOBBY_BEST_PLAY]: {
    route: ROUTES.HOST_LOBBY,
    title: "Best way to play",
    message:
      "Host on a larger screen or screen-share, then have everyone join from their own phone with the room code.",
    dismissLabel: "Got it",
    delayMs: 500,
    visibility: "all",
    persistence: createPersistentTipFlag(
      LOCAL_STORAGE_KEYS.HOST_LOBBY_PLAY_TIP_SEEN,
    ),
  },
  [TIP_KINDS.LANDING_MOBILE_JOIN_GUIDE]: {
    route: ROUTES.LANDING,
    title: "Ready to play?",
    message:
      "Create the lobby on a larger screen, then join here with the code.",
    dismissLabel: "Got it",
    delayMs: 5000,
    visibility: "mobile",
    markSeenOnNavigateTo: [ROUTES.PLAYER_SESSION, ROUTES.GAME_ROOM],
    persistence: createPersistentTipFlag(
      LOCAL_STORAGE_KEYS.LANDING_MOBILE_JOIN_TIP_SEEN,
    ),
  },
};

// #region Utilities

function createPersistentTipFlag(key: AppLocalStorageKey): TipPersistence {
  return {
    isSeen() {
      return getLocalStorageValue(key) === true;
    },
    markSeen() {
      setLocalStorageValue(key, true);
    },
  };
}

export function getTipDefinition(tipKind: TipKind): TipDefinition {
  return TIP_DEFINITIONS[tipKind];
}

export function getTipDelayMs(tipKind: TipKind): number {
  return TIP_DEFINITIONS[tipKind].delayMs ?? 0;
}

export function hasTipBeenSeen(tipKind: TipKind): boolean {
  return TIP_DEFINITIONS[tipKind].persistence?.isSeen() ?? false;
}

export function markTipSeen(tipKind: TipKind) {
  TIP_DEFINITIONS[tipKind].persistence?.markSeen();
}

export function isTipVisibleForViewport(
  tipKind: TipKind,
  isMobileView: boolean,
): boolean {
  const visibility = TIP_DEFINITIONS[tipKind].visibility;

  if (visibility === "all") return true;
  if (visibility === "mobile") return isMobileView;
  return !isMobileView;
}

export function getTipKindForPath(pathname: string): TipKind | null {
  for (const tipKind of TIP_ORDER) {
    if (matchesRoutePath(pathname, TIP_DEFINITIONS[tipKind].route))
      return tipKind;
  }
  return null;
}

export function getTipsToMarkSeenOnNavigation(
  previousPathname: string,
  nextPathname: string,
): TipKind[] {
  return TIP_ORDER.filter((tipKind) => {
    const definition = TIP_DEFINITIONS[tipKind];
    if (!matchesRoutePath(previousPathname, definition.route)) return false;

    return (
      definition.markSeenOnNavigateTo?.some((route) =>
        matchesRoutePath(nextPathname, route),
      ) ?? false
    );
  });
}

// #endregion Utilities
