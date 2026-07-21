import { useEffect, useState } from "react";

/**
 * The given value, updated only after it has stayed unchanged for `delayMs`.
 * Drives type-ahead fetches so a request fires once per pause in typing
 * instead of once per keystroke.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
