type SfxDefinition =
  | {
      kind: "single";
      url: string;
      minRepeatMs: number;
    }
  | {
      kind: "random";
      urls: readonly string[];
      minRepeatMs: number;
      noRepeat?: boolean;
    };

export type SfxId =
  | "hostLobby.playerJoined.hello"
  | "hostLobby.playerLeft.whoosh"
  | "gameRoom.timer.criticalTick"
  | "ui.preview";

const SFX_DEFS: Record<SfxId, SfxDefinition> = {
  "hostLobby.playerJoined.hello": {
    kind: "random",
    urls: __HELLO_JOIN_SOUND_URLS__,
    minRepeatMs: 250,
    noRepeat: true,
  },
  "hostLobby.playerLeft.whoosh": {
    kind: "single",
    url: "/sounds/downward-whoosh.mp3",
    minRepeatMs: 120,
  },
  "gameRoom.timer.criticalTick": {
    kind: "single",
    url: "/sounds/clock-ticking.mp3",
    minRepeatMs: 4500,
  },
  "ui.preview": {
    kind: "single",
    url: "/sounds/downward-whoosh.mp3",
    minRepeatMs: 120,
  },
};

let userSfxVolume01 = 1;
let unlockListenersInstalled = false;

const audioByUrl = new Map<string, HTMLAudioElement>();
const unavailableUrls = new Set<string>();
const lastPlayedAtById = new Map<SfxId, number>();
const lastRandomIndexById = new Map<SfxId, number>();

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function resolveVolume(): number {
  return clamp01(userSfxVolume01);
}

function shouldSkipRateLimit(id: SfxId, minGapMs: number): boolean {
  const now = Date.now();
  const lastPlayedAt = lastPlayedAtById.get(id) ?? 0;
  if (now - lastPlayedAt < minGapMs) return true;
  lastPlayedAtById.set(id, now);
  return false;
}

function getAudioElement(url: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (typeof Audio === "undefined") return null;

  const cached = audioByUrl.get(url);
  if (cached) return cached;

  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = resolveVolume();
  audio.addEventListener("error", () => {
    unavailableUrls.add(url);
    audioByUrl.delete(url);
  });

  audioByUrl.set(url, audio);
  return audio;
}

function playUrl(url: string): boolean {
  if (!url) return false;
  if (unavailableUrls.has(url)) return false;

  const audio = getAudioElement(url);
  if (!audio) return false;

  try {
    // Always apply latest volume before playing.
    audio.volume = resolveVolume();
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise) {
      void playPromise.catch(() => {
        if (audio.error) {
          unavailableUrls.add(url);
          audioByUrl.delete(url);
        }
      });
    }

    return true;
  } catch {
    return false;
  }
}

function resolveUrlForSfx(id: SfxId, def: SfxDefinition): string {
  if (def.kind === "single") return def.url;

  const urls = def.urls;
  if (urls.length === 0) return "";

  let index = Math.floor(Math.random() * urls.length);
  if (def.noRepeat && urls.length > 1) {
    const lastIndex = lastRandomIndexById.get(id);
    if (typeof lastIndex === "number" && lastIndex === index) {
      index =
        (index + 1 + Math.floor(Math.random() * (urls.length - 1))) %
        urls.length;
    }
  }

  lastRandomIndexById.set(id, index);
  return urls[index] ?? "";
}

export function initializeSoundEffects() {
  if (unlockListenersInstalled) return;
  if (typeof window === "undefined") return;

  unlockListenersInstalled = true;

  // We don't "unlock" anything explicitly here; we just ensure the first user
  // gesture happens before any attempt to play audio, which browsers require.
  const unlock = () => undefined;

  window.addEventListener("pointerdown", unlock, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", unlock, { once: true });
}

export function setSoundEffectsVolume(volume01: number) {
  userSfxVolume01 = clamp01(volume01);

  // Apply best-effort volume updates to already-cached audio.
  const volume = resolveVolume();
  for (const audio of audioByUrl.values()) {
    audio.volume = volume;
  }
}

export function playSfx(id: SfxId): boolean {
  initializeSoundEffects();
  if (userSfxVolume01 <= 0) return false;

  const def = SFX_DEFS[id];
  if (!def) return false;
  if (shouldSkipRateLimit(id, def.minRepeatMs)) return false;

  const url = resolveUrlForSfx(id, def);
  return playUrl(url);
}
