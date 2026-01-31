import type * as React from "react";

type OnKeyDownOpts = {
  keys?: ReadonlyArray<string>;
  stopPropagation?: boolean;
  preventSpaceDefault?: boolean;
  ignoreRepeat?: boolean;
};

const DEFAULT_KEYS = ["Enter", " "] as const;

export function handleKeyDown(
  e: React.KeyboardEvent<HTMLElement>,
  handler: (e: React.KeyboardEvent<HTMLElement>) => void,
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
