import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "@/config/env";
import { ROUTES } from "@/routes/routes";

type MetaConfig = {
  title: string;
  description: string;
  robots: string;
};

const DEFAULT_META: MetaConfig = {
  title: "Tiers! With Friends | Real-Time Party Tier List Game",
  description:
    "Play Tiers! With Friends, a real-time multiplayer party game where friends build tier lists together.",
  robots: "index, follow",
};

function resolveMeta(pathname: string): MetaConfig {
  if (pathname === ROUTES.LANDING) return DEFAULT_META;

  if (pathname.startsWith(`${ROUTES.HOST_LOBBY}/`)) {
    return {
      title: "Host Lobby | Tiers! With Friends",
      description:
        "Private host lobby for Tiers! With Friends. Share your room code to start a game.",
      robots: "noindex, nofollow",
    };
  }

  if (pathname.startsWith(`${ROUTES.PLAYER_SESSION}/`)) {
    return {
      title: "Join Lobby | Tiers! With Friends",
      description:
        "Private player session for Tiers! With Friends. Join with a room code.",
      robots: "noindex, nofollow",
    };
  }

  if (pathname.startsWith(`${ROUTES.GAME_ROOM}/`)) {
    return {
      title: "Game Room | Tiers! With Friends",
      description:
        "Private live game room for Tiers! With Friends. Rank items and vote in real time.",
      robots: "noindex, nofollow",
    };
  }

  return {
    ...DEFAULT_META,
    robots: "noindex, nofollow",
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

  canonical.setAttribute("href", href);
}

export function useRouteSeo() {
  const location = useLocation();

  useEffect(
    function syncRouteMeta() {
      const { pathname } = location;
      const meta = resolveMeta(pathname);
      const canonical = new URL(pathname, SITE_URL).toString();

      document.title = meta.title;
      ensureMetaTag("description", meta.description);
      ensureMetaTag("robots", meta.robots);
      ensureMetaTag("twitter:card", "summary");
      ensureMetaTag("twitter:title", meta.title);
      ensureMetaTag("twitter:description", meta.description);

      ensureOgMetaTag("og:type", "website");
      ensureOgMetaTag("og:site_name", "Tiers! With Friends");
      ensureOgMetaTag("og:title", meta.title);
      ensureOgMetaTag("og:description", meta.description);
      ensureOgMetaTag("og:url", canonical);

      ensureCanonical(canonical);
    },
    [location],
  );
}
