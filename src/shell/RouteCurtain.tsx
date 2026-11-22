import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/media-query';
import { preloadPage, push, usePathname } from '../lib/router';

type CurtainState = 'intro' | 'idle' | 'covering' | 'covered' | 'lifting' | 'snap';

const curtain = () => document.querySelector<HTMLElement>('.tp-curtain');

/** How far (ms) the first-load "rest" animation has played; Infinity once it is over. */
function introElapsed() {
  const rest = curtain()
    ?.getAnimations()
    .find((animation) => (animation as CSSAnimation).animationName === 'tp-curtain-rest');
  return rest && rest.playState !== 'finished' && typeof rest.currentTime === 'number' ? rest.currentTime : Infinity;
}

/** True while the blanket still hides the page, so reveals should wait. */
export function curtainDown() {
  const state = curtain()?.dataset.state;
  return (state === 'intro' && introElapsed() < 560) || state === 'covering' || state === 'covered' || state === 'snap';
}

/**
 * Page transition: a quilted blanket drops over the page, the route swaps
 * underneath, then the blanket lifts. The markup and keyframes live in the
 * shell template and stylesheet; this component only moves the element through
 * its `data-state` values with the reference's timings.
 */
export function RouteCurtain() {
  const pathname = usePathname();
  const pending = useRef<string | null>(null);
  const coveredAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastPath = useRef(pathname);
  const keyboard = useRef(false);
  const lift = useRef(() => {});

  useEffect(() => {
    const element = curtain();
    if (!element) return;
    const root = document.documentElement;
    const setState = (state: CurtainState) => {
      element.dataset.state = state;
      if (state === 'idle') delete root.dataset.curtain;
      else root.dataset.curtain = state;
    };
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const later = (callback: () => void, ms: number) => timers.current.push(setTimeout(callback, ms));

    const raise = () => {
      if (element.dataset.state === 'idle' || element.dataset.state === 'lifting') return;
      clearTimers();
      pending.current = null;
      setState('lifting');
      dispatchEvent(new Event('tp:arrived'));
      if (keyboard.current) {
        keyboard.current = false;
        document.getElementById('main')?.focus({ preventScroll: true });
      }
      later(() => setState('idle'), 460);
    };

    const go = (href: string) => {
      const url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.search === location.search) {
        pending.current = null;
        scrollTo({ top: 0, behavior: 'instant' });
        later(raise, 120);
        return;
      }
      void push(url.pathname + url.search + url.hash);
      later(raise, 6000); // safety net if the route never arrives
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      if (
        !link ||
        (link.target && link.target !== '_self') ||
        link.hasAttribute('download') ||
        link.dataset.noCurtain !== undefined
      )
        return;
      const url = new URL(link.href, location.href);
      const internal = url.origin === location.origin && !/^\/(admin|api|media|_next)(\/|$)/.test(url.pathname);
      const leavesPage = url.pathname !== location.pathname || (!url.hash && url.search === location.search);
      if (!internal || !leavesPage || prefersReducedMotion()) return;

      event.preventDefault();
      event.stopPropagation();
      keyboard.current = event.detail === 0;
      void preloadPage(url.pathname);
      dispatchEvent(new Event('tp:navigate'));
      const state = element.dataset.state;
      pending.current = url.href;
      if (state === 'covered' || state === 'snap') return go(url.href);
      if (state === 'covering') return;
      clearTimers();
      if (state === 'intro' && introElapsed() < 1080) {
        setState('covered');
        coveredAt.current = performance.now();
        go(url.href);
      } else {
        setState('covering');
        later(() => {
          setState('covered');
          coveredAt.current = performance.now();
          if (pending.current) go(pending.current);
        }, 300);
      }
    };

    // Back / forward: drop the blanket instantly, then lift once the page swapped.
    const onPopState = () => {
      if (prefersReducedMotion() || location.pathname === lastPath.current) return;
      clearTimers();
      setState('snap');
      coveredAt.current = performance.now();
      later(raise, 1400);
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      clearTimers();
      setState('idle');
    };

    if (element.dataset.state === 'intro') {
      const elapsed = introElapsed();
      later(() => dispatchEvent(new Event('tp:arrived')), Math.max(0, 560 - elapsed));
      later(() => element.dataset.state === 'intro' && setState('idle'), Math.max(0, 1080 - elapsed));
    }
    if (prefersReducedMotion()) setState('idle');

    addEventListener('click', onClick, true);
    addEventListener('popstate', onPopState);
    addEventListener('pageshow', onPageShow);
    lift.current = raise;
    return () => {
      clearTimers();
      delete root.dataset.curtain;
      removeEventListener('click', onClick, true);
      removeEventListener('popstate', onPopState);
      removeEventListener('pageshow', onPageShow);
    };
  }, []);

  // The new route has rendered: keep the blanket down a beat, then lift.
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    const state = curtain()?.dataset.state;
    if (state !== 'covered' && state !== 'snap' && state !== 'covering') return;
    const hold = Math.max(0, 140 - (performance.now() - coveredAt.current));
    const timer = setTimeout(() => requestAnimationFrame(() => lift.current()), state === 'covering' ? 340 : hold);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
