import {
  AVATAR_BASE,
  AVATAR_PARTS_COUNT,
  type Avatar,
  type AvatarParts,
} from "@twf/contracts";

type PlayerAvatarLayers = {
  bodySrc: string;
  mouthSrc: string;
  eyesSrc: string;
};

const BODY_ASSET_MODULES = import.meta.glob(
  "/src/assets/public/PlayerIcons/Bodies/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

const MOUTH_ASSET_MODULES = import.meta.glob(
  "/src/assets/public/PlayerIcons/Mouths/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

const EYE_ASSET_MODULES = import.meta.glob(
  "/src/assets/public/PlayerIcons/Eyes/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

function toOrderedAssetList(assetModules: Record<string, string>): string[] {
  return Object.entries(assetModules)
    .sort(([pathA], [pathB]) =>
      pathA.localeCompare(pathB, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .map(([, src]) => src);
}

const BODY_ASSETS = toOrderedAssetList(BODY_ASSET_MODULES);
const MOUTH_ASSETS = toOrderedAssetList(MOUTH_ASSET_MODULES);
const EYE_ASSETS = toOrderedAssetList(EYE_ASSET_MODULES);

function decodeAvatar(avatar: Avatar | string): AvatarParts | null {
  const segments = avatar.split(".");
  if (segments.length !== AVATAR_PARTS_COUNT) return null;

  const body = parseInt(segments[0] ?? "", AVATAR_BASE);
  const mouth = parseInt(segments[1] ?? "", AVATAR_BASE);
  const eyes = parseInt(segments[2] ?? "", AVATAR_BASE);

  if (Number.isNaN(body) || Number.isNaN(mouth) || Number.isNaN(eyes)) {
    return null;
  }

  return { body, mouth, eyes };
}

function safeAssetAt(assets: readonly string[], index: number): string | null {
  if (assets.length === 0) return null;
  if (!Number.isInteger(index)) return assets[0] ?? null;

  const wrapped = ((index % assets.length) + assets.length) % assets.length;
  return assets[wrapped] ?? null;
}

export function resolvePlayerAvatarLayers(
  avatar: Avatar | string | null | undefined,
): PlayerAvatarLayers | null {
  if (!avatar) return null;

  const decoded = decodeAvatar(avatar);
  if (!decoded) return null;

  const bodySrc = safeAssetAt(BODY_ASSETS, decoded.body);
  const mouthSrc = safeAssetAt(MOUTH_ASSETS, decoded.mouth);
  const eyesSrc = safeAssetAt(EYE_ASSETS, decoded.eyes);

  if (!bodySrc || !mouthSrc || !eyesSrc) return null;

  return { bodySrc, mouthSrc, eyesSrc };
}
