import {
  ArrowBigDownDash,
  ArrowBigUpDash,
  ArrowRight,
  Bug,
  Check,
  Clock3,
  CircleHelp,
  CircleUserRound,
  Contrast,
  Copy,
  EyeOff,
  Hash,
  Lock,
  LockOpen,
  LogOut,
  Minus,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Settings,
  Volume2,
  VibrateOff,
  MousePointer2,
  type LucideIcon,
} from "lucide-react";

export type AppIconValue<T> = T extends LucideIcon
  ? T
  : T extends Record<string, infer TValue>
    ? AppIconValue<TValue>
    : never;

export const APP_ICONS = {
  copy: Copy,
  copied: Check,
  settings: Settings,
  gameSettings: SlidersHorizontal,
  startGame: Play,
  exit: LogOut,
  reportIssue: Bug,
  timer: Clock3,
  reset: RotateCcw,
  lobbyCode: Hash,
  playerName: CircleUserRound,
  reduceMotion: VibrateOff,
  highContrast: Contrast,
  showTips: CircleHelp,
  streamerMode: EyeOff,
  soundEffects: Volume2,
  mouse: MousePointer2,
  lock: Lock,
  unlock: LockOpen,
  place: {
    confirm: Check,
    pass: ArrowRight,
  },
  vote: {
    up: ArrowBigUpDash,
    agree: Minus,
    down: ArrowBigDownDash,
  },
} as const;

export const ICON_PROPS = {
  copyButton: {
    size: 18,
    strokeWidth: 2.4,
  },
  quickActions: {
    size: 20,
    strokeWidth: 2.4,
  },
  place: {
    controls: {
      size: 22,
      strokeWidth: 2.8,
    },
  },
  settingsRow: {
    size: 18,
    strokeWidth: 2.4,
  },
  accentTextInput: {
    size: 16,
    strokeWidth: 2.4,
  },
  vote: {
    controls: {
      size: 22,
      strokeWidth: 2.8,
    },
    results: {
      size: 50,
      strokeWidth: 3,
    },
  },
} as const;
