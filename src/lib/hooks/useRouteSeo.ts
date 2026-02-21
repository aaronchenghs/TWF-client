import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "@/config/env";
import { TAB_TITLES } from "@/lib/constants/tabTitles";
import { ROUTES } from "@/routes/routes";

type MetaConfig = {
  title: string;
  description: string;
  robots: string;
};

const SITE_NAME = TAB_TITLES.APP_NAME;
const ROBOTS_PUBLIC = "index, follow";
const ROBOTS_PRIVATE = "noindex, nofollow";

const DEFAULT_DESCRIPTION =
  "Play Tiers! With Friends, a real-time multiplayer party game where friends build tier lists together.";
const HOST_LOBBY_DESCRIPTION =
  "Private host lobby for Tiers! With Friends. Share your room code to start a game.";
const PLAYER_SESSION_DESCRIPTION =
  "Private player session for Tiers! With Friends. Join with a room code.";
const GAME_ROOM_DESCRIPTION =
  "Private live game room for Tiers! With Friends. Rank items and vote in real time.";

function asPrivateMeta(title: string, description: string): MetaConfig {
  return { title, description, robots: ROBOTS_PRIVATE };
}

const DEFAULT_META: MetaConfig = {
  title: TAB_TITLES.DEFAULT,
  description: DEFAULT_DESCRIPTION,
  robots: ROBOTS_PUBLIC,
};

function resolveMeta(pathname: string): MetaConfig {
  if (pathname === ROUTES.LANDING) return DEFAULT_META;

  if (pathname.startsWith(`${ROUTES.HOST_LOBBY}/`))
    return asPrivateMeta(TAB_TITLES.HOST_LOBBY, HOST_LOBBY_DESCRIPTION);

  if (pathname.startsWith(`${ROUTES.PLAYER_SESSION}/`))
    return asPrivateMeta(TAB_TITLES.PLAYER_LOBBY, PLAYER_SESSION_DESCRIPTION);

  if (pathname.startsWith(`${ROUTES.GAME_ROOM}/`))
    return asPrivateMeta(TAB_TITLES.GAME_ROOM, GAME_ROOM_DESCRIPTION);

  return {
    ...DEFAULT_META,
    robots: ROBOTS_PRIVATE,
  };
}

function ensureMetaTag(name: string, content: string) {
  let tag = document.head.querySelector(
    `meta[name="${name}"]`,
  ) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }

  if (tag.getAttribute("content") !== content)
    tag.setAttribute("content", content);
}

function ensureOgMetaTag(property: string, content: string) {
  let tag = document.head.querySelector(
    `meta[property="${property}"]`,
  ) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }

  if (tag.getAttribute("content") !== content)
    tag.setAttribute("content", content);
}

function ensureCanonical(href: string) {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  if (canonical.getAttribute("href") !== href)
    canonical.setAttribute("href", href);
}

export function useRouteSeo() {
  const { pathname } = useLocation();

  useEffect(
    function syncRouteMeta() {
      const meta = resolveMeta(pathname);
      const canonical = new URL(pathname, SITE_URL).toString();

      if (document.title !== meta.title) document.title = meta.title;

      ensureMetaTag("description", meta.description);
      ensureMetaTag("robots", meta.robots);
      ensureMetaTag("twitter:card", "summary");
      ensureMetaTag("twitter:title", meta.title);
      ensureMetaTag("twitter:description", meta.description);

      ensureOgMetaTag("og:type", "website");
      ensureOgMetaTag("og:site_name", SITE_NAME);
      ensureOgMetaTag("og:title", meta.title);
      ensureOgMetaTag("og:description", meta.description);
      ensureOgMetaTag("og:url", canonical);

      ensureCanonical(canonical);
    },
    [pathname],
  );
}
