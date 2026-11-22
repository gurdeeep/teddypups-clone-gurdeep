import { useEffect } from 'react';
import Lenis from 'lenis';
import { cancelFrame, frame } from 'motion';
import { prefersReducedMotion, useReducedMotion } from '../lib/media-query';

let lenis: Lenis | null = null;

/**
 * Inertial wheel scrolling on mouse devices, plus smooth in-page anchor jumps.
 * Same settings as the reference: lerp 0.1, wheel multiplier 0.85, and native
 * scrolling inside dialogs. Touch devices and reduced-motion users keep the
 * browser's own scrolling.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.detail === 0 ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href*='#']");
      if (!link || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        url.hash.length < 2
      )
        return;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = [...document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)].find(
        (element) => element.getClientRects().length,
      );
      if (!target) return;
      event.preventDefault();
      if (lenis) lenis.scrollTo(target);
      else target.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
      history.pushState(null, '', url.hash);
    };
    addEventListener('click', onClick);
    return () => removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const root = document.documentElement;
    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      wheelMultiplier: 0.85,
      prevent: (node) => !!node.closest?.('dialog, [data-lenis-prevent]'),
      virtualScroll: () => getComputedStyle(root).overflowY !== 'hidden',
    });
    lenis = instance;
    // After a route change the page jumps; tell Lenis so it does not animate back.
    const sync = () => instance.scrollTo(instance.actualScroll, { immediate: true });
    addEventListener('tp:navigate', sync);
    addEventListener('popstate', sync);
    const step = (data: { timestamp: number }) => instance.raf(data.timestamp);
    frame.read(step, true);
    return () => {
      cancelFrame(step);
      removeEventListener('tp:navigate', sync);
      removeEventListener('popstate', sync);
      instance.destroy();
      lenis = null;
    };
  }, [reduced]);

  return null;
}

/** Jump the page without animation, keeping Lenis in step. */
export function jumpTo(top: number) {
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else scrollTo({ top, behavior: 'instant' });
}
