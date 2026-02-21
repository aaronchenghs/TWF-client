export const normalizeCode = (code: string): string => {
  return code.trim().toUpperCase();
};

export const normalizeName = (name: string | undefined | null): string => {
  return (name ?? "").trim();
};
