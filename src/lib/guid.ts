import { v4 as uuidv4 } from "uuid";

export type Guid = string & { readonly __brand: "Guid" };

export function newGuid(): Guid {
  return uuidv4() as Guid;
}
