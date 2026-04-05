import { useState, useEffect, useRef } from "react";
import { loadSync, save, hydrateFromIDB } from "./db.js";

/**
 * useState that persists to IndexedDB + localStorage.
 * - Initial render: sync from localStorage (fast, no flicker)
 * - After mount: hydrate from IndexedDB (authoritative)
 * - On change: write to both IndexedDB + localStorage
 */
export function usePersistedState(key, fallback) {
  const [state, setState] = useState(() => loadSync(key, fallback));
  const isHydrated = useRef(false);

  // Hydrate from IDB after mount
  useEffect(() => {
    hydrateFromIDB(key, state, (val) => {
      isHydrated.current = true;
      setState(val);
    }).then(() => { isHydrated.current = true; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist on change (skip the hydration write)
  useEffect(() => {
    if (isHydrated.current) {
      save(key, state);
    }
  }, [key, state]);

  return [state, setState];
}
