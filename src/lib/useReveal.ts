import { useEffect } from 'react';
import { curtainDown } from '../shell/RouteCurtain';
import { prefersReducedMotion } from './media-query';

const PENDING = '[data-reveal]:not([data-revealed])';

/**
 * Scroll-reveal for every `[data-reveal]` element on the current page.
 *
 * Elements already on screen are shown at once. The rest are "armed" (the
 * stylesheet hides armed elements) and revealed as they scroll into view. While
 * the page-transition blanket is down, reveals are held back and released
 * together when it lifts, so entrance animations are never played unseen.
 */
export function useReveal(pathname: string) {
  useEffect(() => {
    const scope = document.body;
    const all = () => scope.querySelectorAll<HTMLElement>(PENDING);

    if (prefersReducedMotion()) {
      const showAll = () => all().forEach((element) => (element.dataset.revealed = 'true'));
      showAll();
      const watcher = new MutationObserver(showAll);
      watcher.observe(scope, { childList: true, subtree: true });
      return () => watcher.disconnect();
    }

    const held = new Set<HTMLElement>();
    const reveal = (element: HTMLElement) => {
      element.dataset.revealed = 'true';
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          if (curtainDown()) held.add(element);
          else reveal(element);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );
    const arm = (element: HTMLElement) => {
      if (element.dataset.armed) return observer.observe(element);
      const box = element.getBoundingClientRect();
      if (box.top < innerHeight && box.bottom > 0 && !curtainDown()) {
        element.dataset.revealed = 'true';
        return;
      }
      element.dataset.armed = 'true';
      observer.observe(element);
    };
    all().forEach(arm);
    const watcher = new MutationObserver(() => all().forEach(arm));
    watcher.observe(scope, { childList: true, subtree: true });

    const release = () => {
      held.forEach(reveal);
      held.clear();
    };
    addEventListener('tp:arrived', release);
    let timer: ReturnType<typeof setTimeout>;
    const retry = () => {
      if (curtainDown()) timer = setTimeout(retry, 400);
      else release();
    };
    timer = setTimeout(retry, 1600);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      watcher.disconnect();
      removeEventListener('tp:arrived', release);
    };
  }, [pathname]);
}
