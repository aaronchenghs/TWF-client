export const REGEX = {
  whitespace: /\s+/g,
  nonAlphabetic: /[^a-z]+/gi,
  tierItemIdSeparator: /[-_]/g,
  trailingCssUnit: /[a-z%]+$/i,
} as const;
