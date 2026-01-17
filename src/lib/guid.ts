import { v4 as uuidv4 } from "uuid";

export type Guid = string & { readonly __brand: "Guid" };

export function newGuid(): Guid {
  return uuidv4() as Guid;
}

export function asGuid(value: string): Guid {
  return value as Guid;
}

export function isGuid(value: string): value is Guid {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
