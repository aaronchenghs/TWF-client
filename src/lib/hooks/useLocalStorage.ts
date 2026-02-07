import { useCallback } from "react";
import {
  getLocalStorageValue,
  removeLocalStorageValue,
  setLocalStorageValue,
  type AppLocalStorageKey,
  type AppLocalStorageValue,
} from "@/lib/localStorage";

export type UseLocalStorageResult<K extends AppLocalStorageKey> = {
  getValue: (
    fallback?: AppLocalStorageValue<K>,
  ) => AppLocalStorageValue<K> | null;
  setValue: (nextValue: AppLocalStorageValue<K>) => void;
  removeValue: () => void;
};

export function useLocalStorage<K extends AppLocalStorageKey>(
  key: K,
): UseLocalStorageResult<K> {
  const getValue = useCallback(
    (fallback?: AppLocalStorageValue<K>): AppLocalStorageValue<K> | null => {
      const storedValue = getLocalStorageValue(key);
      return storedValue ?? fallback ?? null;
    },
    [key],
  );

  const setValue = useCallback(
    (nextValue: AppLocalStorageValue<K>) => {
      setLocalStorageValue(key, nextValue);
    },
    [key],
  );

  const removeValue = useCallback(() => {
    removeLocalStorageValue(key);
  }, [key]);

  return { getValue, setValue, removeValue };
}
