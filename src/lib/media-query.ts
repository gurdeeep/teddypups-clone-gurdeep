import { useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** One-off check, for code that runs outside React (event handlers, effects). */
export const prefersReducedMotion = () => matchMedia(REDUCED_MOTION).matches;

/** Subscribes a component to a CSS media query. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => matchMedia(query).matches,
  );
}

export const useReducedMotion = () => useMediaQuery(REDUCED_MOTION);
