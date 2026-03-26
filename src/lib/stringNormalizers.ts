import { REGEX } from "@/lib/constants/regex";

export const normalizeCode = (code: string): string => {
  return code.replace(REGEX.whitespace, "").toUpperCase();
};

export const normalizeAlphabeticCodeInput = (code: string): string => {
  return code.replace(REGEX.nonAlphabetic, "").toUpperCase();
};

export const normalizeName = (name: string | undefined | null): string => {
  return (name ?? "").trim();
};
