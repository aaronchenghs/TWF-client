import { tryit } from "radashi";

const tryParseJson = tryit((raw: string): unknown => JSON.parse(raw));

export function safeJsonParse<T>(
  raw: string,
  validate?: (value: unknown) => value is T,
): T | null {
  const [error, value] = tryParseJson(raw);
  if (error) return null;
  if (validate && !validate(value)) return null;
  return value as T;
}
