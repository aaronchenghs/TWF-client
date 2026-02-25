export type SoundEffectId =
  | "runningOutOfTime"
  | "placementLocked"
  | "playerJoined"
  | "playerLeft"
  | "voteUp"
  | "voteDown"
  | "gameStart"
  | "finish";

type ToneEvent = {
  atMs: number;
  durationMs: number;
  frequency: number;
  toFrequency?: number;
  gain?: number;
  type?: OscillatorType;
};

const MASTER_GAIN = 0.14;
const DEFAULT_TONE_GAIN = 0.62;
const MIN_FREQUENCY = 40;

const STOCK_SOUND_URL_BY_EFFECT: Record<SoundEffectId, string> = {
  runningOutOfTime: "/sounds/running-out-of-time.mp3",
  placementLocked: "/sounds/placement-locked.mp3",
  playerJoined: "/sounds/player-joined.mp3",
  playerLeft: "/sounds/player-left.mp3",
  voteUp: "/sounds/vote-up.mp3",
  voteDown: "/sounds/vote-down.mp3",
  gameStart: "/sounds/game-start.mp3",
  finish: "/sounds/finish.mp3",
};

const TONE_EVENTS_BY_EFFECT: Record<SoundEffectId, readonly ToneEvent[]> = {
  runningOutOfTime: [
    { atMs: 0, durationMs: 75, frequency: 940, gain: 0.7, type: "square" },
    { atMs: 165, durationMs: 75, frequency: 940, gain: 0.7, type: "square" },
    { atMs: 330, durationMs: 95, frequency: 730, gain: 0.75, type: "square" },
  ],
  placementLocked: [
    {
      atMs: 0,
      durationMs: 95,
      frequency: 700,
      toFrequency: 560,
      gain: 0.65,
      type: "triangle",
    },
    {
      atMs: 120,
      durationMs: 130,
      frequency: 500,
      toFrequency: 330,
      gain: 0.65,
      type: "triangle",
    },
  ],
  playerJoined: [
    {
      atMs: 0,
      durationMs: 95,
      frequency: 520,
      toFrequency: 690,
      gain: 0.6,
      type: "sine",
    },
    {
      atMs: 95,
      durationMs: 120,
      frequency: 700,
      toFrequency: 920,
      gain: 0.64,
      type: "triangle",
    },
  ],
  playerLeft: [
    {
      atMs: 0,
      durationMs: 110,
      frequency: 700,
      toFrequency: 520,
      gain: 0.58,
      type: "sine",
    },
    {
      atMs: 110,
      durationMs: 150,
      frequency: 500,
      toFrequency: 280,
      gain: 0.6,
      type: "triangle",
    },
  ],
  voteUp: [
    {
      atMs: 0,
      durationMs: 70,
      frequency: 430,
      toFrequency: 560,
      gain: 0.6,
      type: "square",
    },
    {
      atMs: 60,
      durationMs: 85,
      frequency: 590,
      toFrequency: 760,
      gain: 0.62,
      type: "square",
    },
  ],
  voteDown: [
    {
      atMs: 0,
      durationMs: 70,
      frequency: 760,
      toFrequency: 580,
      gain: 0.6,
      type: "square",
    },
    {
      atMs: 60,
      durationMs: 85,
      frequency: 560,
      toFrequency: 390,
      gain: 0.62,
      type: "square",
    },
  ],
  gameStart: [
    {
      atMs: 0,
      durationMs: 125,
      frequency: 520,
      toFrequency: 640,
      gain: 0.62,
      type: "triangle",
    },
    {
      atMs: 115,
      durationMs: 135,
      frequency: 660,
      toFrequency: 820,
      gain: 0.62,
      type: "triangle",
    },
    {
      atMs: 230,
      durationMs: 180,
      frequency: 780,
      toFrequency: 1050,
      gain: 0.68,
      type: "triangle",
    },
  ],
  finish: [
    {
      atMs: 0,
      durationMs: 130,
      frequency: 420,
      toFrequency: 560,
      gain: 0.62,
      type: "triangle",
    },
    {
      atMs: 140,
      durationMs: 140,
      frequency: 560,
      toFrequency: 700,
      gain: 0.62,
      type: "triangle",
    },
    {
      atMs: 280,
      durationMs: 160,
      frequency: 700,
      toFrequency: 930,
      gain: 0.66,
      type: "triangle",
    },
    {
      atMs: 460,
      durationMs: 230,
      frequency: 930,
      toFrequency: 1170,
      gain: 0.7,
      type: "sawtooth",
    },
  ],
};

const MIN_REPEAT_INTERVAL_MS: Partial<Record<SoundEffectId, number>> = {
  runningOutOfTime: 800,
  placementLocked: 200,
  playerJoined: 120,
  playerLeft: 120,
  voteUp: 60,
  voteDown: 60,
  gameStart: 1000,
  finish: 1000,
};

let audioContext: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let unlockListenersInstalled = false;
const lastPlayedAtByEffect = new Map<SoundEffectId, number>();
const stockAudioByEffect = new Map<SoundEffectId, HTMLAudioElement>();
const unavailableStockEffects = new Set<SoundEffectId>();
const customAudioByUrl = new Map<string, HTMLAudioElement>();
const unavailableCustomUrls = new Set<string>();
const lastPlayedAtByKey = new Map<string, number>();
let lastHelloJoinIndex: number | null = null;

function ensureAudioGraph() {
  if (typeof window === "undefined") return null;
  if (typeof AudioContext === "undefined") return null;

  if (!audioContext) {
    audioContext = new AudioContext();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.setValueAtTime(MASTER_GAIN, audioContext.currentTime);
    masterGainNode.connect(audioContext.destination);
  }

  if (!masterGainNode) return null;
  return { audioContext, masterGainNode };
}

function scheduleTone(
  ctx: AudioContext,
  output: GainNode,
  startAt: number,
  tone: ToneEvent,
) {
  const durationSec = Math.max(0.02, tone.durationMs / 1000);
  const stopAt = startAt + durationSec;
  const attackSec = Math.min(0.02, durationSec * 0.4);
  const peakGain = Math.max(0.0001, tone.gain ?? DEFAULT_TONE_GAIN);

  const oscillator = ctx.createOscillator();
  oscillator.type = tone.type ?? "triangle";
  oscillator.frequency.setValueAtTime(
    Math.max(MIN_FREQUENCY, tone.frequency),
    startAt,
  );

  if (tone.toFrequency != null) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(MIN_FREQUENCY, tone.toFrequency),
      stopAt,
    );
  }

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + attackSec);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  oscillator.connect(gainNode);
  gainNode.connect(output);

  oscillator.start(startAt);
  oscillator.stop(stopAt + 0.02);
}

function playToneEffect(effect: SoundEffectId) {
  const graph = ensureAudioGraph();
  if (!graph) return;

  const { audioContext: ctx, masterGainNode: output } = graph;

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }

  const startAt = ctx.currentTime + 0.01;
  const tones = TONE_EVENTS_BY_EFFECT[effect];
  for (const tone of tones) {
    scheduleTone(ctx, output, startAt + tone.atMs / 1000, tone);
  }
}

function speakGameStartCue() {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const utterance = new SpeechSynthesisUtterance("Tiers!");
  utterance.rate = 0.98;
  utterance.pitch = 1.05;
  utterance.volume = 0.95;
  synth.speak(utterance);
}

function getStockAudioElement(effect: SoundEffectId): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (typeof Audio === "undefined") return null;

  const cached = stockAudioByEffect.get(effect);
  if (cached) return cached;

  const audio = new Audio(STOCK_SOUND_URL_BY_EFFECT[effect]);
  audio.preload = "auto";
  audio.volume = 0.9;
  audio.addEventListener("error", () => {
    unavailableStockEffects.add(effect);
    stockAudioByEffect.delete(effect);
  });

  stockAudioByEffect.set(effect, audio);
  return audio;
}

function getCustomAudioElement(url: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (typeof Audio === "undefined") return null;

  const cached = customAudioByUrl.get(url);
  if (cached) return cached;

  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = 0.9;
  audio.addEventListener("error", () => {
    unavailableCustomUrls.add(url);
    customAudioByUrl.delete(url);
  });

  customAudioByUrl.set(url, audio);
  return audio;
}

function shouldSkipKeyRateLimit(key: string, minGapMs: number): boolean {
  const now = Date.now();
  const lastPlayedAt = lastPlayedAtByKey.get(key) ?? 0;
  if (now - lastPlayedAt < minGapMs) return true;
  lastPlayedAtByKey.set(key, now);
  return false;
}

function playCustomSoundUrl(url: string): boolean {
  if (unavailableCustomUrls.has(url)) return false;

  const audio = getCustomAudioElement(url);
  if (!audio) return false;

  try {
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise) {
      void playPromise.catch(() => {
        if (audio.error) {
          unavailableCustomUrls.add(url);
          customAudioByUrl.delete(url);
        }
      });
    }

    return true;
  } catch {
    return false;
  }
}

function playStockSound(effect: SoundEffectId): boolean {
  if (unavailableStockEffects.has(effect)) return false;

  const audio = getStockAudioElement(effect);
  if (!audio) return false;

  try {
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise) {
      void playPromise.catch(() => {
        if (audio.error) {
          unavailableStockEffects.add(effect);
          stockAudioByEffect.delete(effect);
        }
        // Fallback for missing files, blocked autoplay, or failed decode.
        playToneEffect(effect);
      });
    }

    return true;
  } catch {
    return false;
  }
}

function shouldSkipDueToRateLimit(effect: SoundEffectId): boolean {
  const now = Date.now();
  const minGapMs = MIN_REPEAT_INTERVAL_MS[effect] ?? 0;
  const lastPlayedAt = lastPlayedAtByEffect.get(effect) ?? 0;
  if (now - lastPlayedAt < minGapMs) return true;
  lastPlayedAtByEffect.set(effect, now);
  return false;
}

export function initializeSoundEffects() {
  if (unlockListenersInstalled) return;
  if (typeof window === "undefined") return;

  unlockListenersInstalled = true;

  const unlock = () => {
    const graph = ensureAudioGraph();
    if (!graph) return;
    void graph.audioContext.resume().catch(() => undefined);
  };

  window.addEventListener("pointerdown", unlock, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", unlock, { once: true });
}

export function playRandomHelloJoinSound() {
  initializeSoundEffects();
  if (shouldSkipKeyRateLimit("helloJoin", 250)) return;

  const urls = __HELLO_JOIN_SOUND_URLS__;
  if (urls.length === 0) return;

  let index = Math.floor(Math.random() * urls.length);
  if (urls.length > 1 && lastHelloJoinIndex === index) {
    index =
      (index + 1 + Math.floor(Math.random() * (urls.length - 1))) % urls.length;
  }
  lastHelloJoinIndex = index;

  void playCustomSoundUrl(urls[index] ?? "");
}

export function playSoundEffect(effect: SoundEffectId) {
  initializeSoundEffects();
  if (shouldSkipDueToRateLimit(effect)) return;

  if (effect === "gameStart") speakGameStartCue();

  const playedStockSound = playStockSound(effect);
  if (!playedStockSound) playToneEffect(effect);
}
