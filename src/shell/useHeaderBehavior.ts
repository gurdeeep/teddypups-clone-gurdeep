import { useEffect } from 'react';

/**
 * Sticky header states, written as data attributes the stylesheet reacts to:
 * `data-scrolled` once the page moves, and `data-hidden` while scrolling down
 * past 220px (it slides back in on any upward scroll or keyboard focus).
 */
export function useHeaderBehavior() {
  useEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;
    let last = scrollY;
    let queued = false;
    const update = () => {
      const y = scrollY;
      header.dataset.scrolled = y > 8 ? 'true' : 'false';
      if (Math.abs(y - last) > 6) {
        header.dataset.hidden = y > last && y > 220 ? 'true' : 'false';
        last = y;
      }
      queued = false;
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    const show = () => (header.dataset.hidden = 'false');
    update();
    addEventListener('scroll', onScroll, { passive: true });
    header.addEventListener('focusin', show);
    return () => {
      removeEventListener('scroll', onScroll);
      header.removeEventListener('focusin', show);
    };
  }, []);
}
