import { useEffect } from 'react';
import { normalisePath, pages, preloadPage } from './router';

/** The route a link leads to, if it is one of this site's pages other than the current one. */
function routeOf(link: HTMLAnchorElement) {
  if (link.origin !== location.origin) return null;
  const route = normalisePath(link.pathname);
  return pages[route] && route !== normalisePath(location.pathname) ? route : null;
}

/* Background prefetches go through a queue, two at a time, so they never crowd out
   the photos on screen or the page the visitor actually clicks. */
const queue: string[] = [];
const seen = new Set<string>();
let active = 0;

function pump() {
  while (active < 2 && queue.length) {
    active++;
    // A failed prefetch is not an error: the click will try again, with its own fallback.
    preloadPage(queue.shift()!)
      .catch(() => {})
      .finally(() => {
        active--;
        pump();
      });
  }
}

function enqueue(route: string) {
  if (seen.has(route)) return;
  seen.add(route);
  queue.push(route);
  pump();
}

/**
 * Fetches the template chunk of every page linked from what is on screen, the
 * way the reference (Next.js) prefetches visible links. A click can then swap
 * the route as soon as the blanket is down, instead of holding the blanket
 * while the next page downloads.
 */
export function usePrefetch(pathname: string) {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    const slow = connection?.saveData || /2g/.test(connection?.effectiveType ?? '');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const route = routeOf(entry.target as HTMLAnchorElement);
          if (route) enqueue(route);
        }
      },
      { rootMargin: '200px' },
    );
    // Wait until the blanket has lifted and the first screen has had its turn on the network.
    const timer = setTimeout(() => {
      if (slow) return;
      for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        if (routeOf(link)) observer.observe(link);
      }
    }, 1200);

    // Hover, touch or keyboard focus means a click is likely: fetch that page now, ahead of the queue.
    const onIntent = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      const route = link && routeOf(link);
      if (route) preloadPage(route).catch(() => {});
    };
    addEventListener('pointerover', onIntent, { passive: true });
    addEventListener('touchstart', onIntent, { passive: true });
    addEventListener('focusin', onIntent);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      removeEventListener('pointerover', onIntent);
      removeEventListener('touchstart', onIntent);
      removeEventListener('focusin', onIntent);
    };
  }, [pathname]);
}
