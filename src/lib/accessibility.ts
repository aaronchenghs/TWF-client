import type * as React from "react";

export type KeyboardKey = React.KeyboardEvent<HTMLElement>["key"];

type OnKeyDownOpts = {
  keys?: ReadonlyArray<KeyboardKey>;
  stopPropagation?: boolean;
  preventSpaceDefault?: boolean;
  ignoreRepeat?: boolean;
};

const DEFAULT_KEYS = ["Enter", " "] as const satisfies readonly KeyboardKey[];

export const SLIDER_COMMIT_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
] as const satisfies readonly KeyboardKey[];

export type SliderCommitKey = (typeof SLIDER_COMMIT_KEYS)[number];

export function isSliderCommitKey(key: KeyboardKey): key is SliderCommitKey {
  return (SLIDER_COMMIT_KEYS as readonly KeyboardKey[]).includes(key);
}

export function handleKeyDown(
  e: React.KeyboardEvent<HTMLElement> | KeyboardEvent,
  handler: (e: React.KeyboardEvent<HTMLElement> | KeyboardEvent) => void,
  opts: OnKeyDownOpts = {},
) {
  const {
    keys = DEFAULT_KEYS,
    stopPropagation = false,
    preventSpaceDefault = true,
    ignoreRepeat = true,
  } = opts;

  if (ignoreRepeat && e.repeat) return;
  if (!keys.includes(e.key)) return;

  if (stopPropagation) e.stopPropagation();
  if (e.key === " " && preventSpaceDefault) e.preventDefault();

  handler(e);
}
