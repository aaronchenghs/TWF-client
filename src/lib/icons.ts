import {
  ArrowBigDownDash,
  ArrowBigUpDash,
  Bug,
  Check,
  CircleHelp,
  Contrast,
  Copy,
  EyeOff,
  Minus,
  Settings,
  VibrateOff,
} from "lucide-react";

export const APP_ICONS = {
  copy: Copy,
  copied: Check,
  settings: Settings,
  reportIssue: Bug,
  reduceMotion: VibrateOff,
  highContrast: Contrast,
  showTips: CircleHelp,
  streamerMode: EyeOff,
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
  settingsRow: {
    size: 18,
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
