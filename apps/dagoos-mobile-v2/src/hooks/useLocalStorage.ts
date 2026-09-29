// ============================================================
// Hooks — useLocalStorage
// Phase 1 — Étape 1.3
// ============================================================

import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'dagoos_v2_';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const fullKey = PREFIX + key;

  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(fullKey);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch (err) {
      console.warn('[useLocalStorage] lecture échouée pour', key, err);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(stored));
    } catch (err) {
      console.warn('[useLocalStorage] écriture échouée pour', key, err);
    }
  }, [fullKey, key, stored]);

  const setValue = useCallback((value: T) => {
    setStored(value);
  }, []);

  return [stored, setValue];
}
