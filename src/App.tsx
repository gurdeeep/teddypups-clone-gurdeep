import { useEffect, useLayoutEffect, useRef } from 'react';
import { MotionConfig } from 'motion/react';
import { pages, push, usePathname } from './lib/router';
import { useDocumentMeta } from './lib/useDocumentMeta';
import { usePrefetch } from './lib/usePrefetch';
import { useReveal } from './lib/useReveal';
import { useScrollEffects } from './lib/useScrollEffects';
import { Page } from './pages/Page';
import { PawTrail } from './shell/PawTrail';
import { RouteCurtain } from './shell/RouteCurtain';
import { ShellFoot, ShellHead } from './shell/Shell';
import { SmoothScroll, jumpTo } from './shell/SmoothScroll';

/** After a navigation, start the new page at the top (or at its #anchor). */
function useScrollReset(pathname: string) {
  const first = useRef(true);
  const viaHistory = useRef(false);
  useEffect(() => {
    const mark = () => (viaHistory.current = true);
    addEventListener('popstate', mark);
    return () => removeEventListener('popstate', mark);
  }, []);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (viaHistory.current) {
      viaHistory.current = false; // back / forward: the browser restores the position
      return;
    }
    const target =
      location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else jumpTo(0);
  }, [pathname]);
}

/**
 * Internal links the transition blanket did not handle (reduced motion, or a
 * link that only changes the query string) still navigate without a reload.
 */
function useClientLinks() {
  useEffect(() => {
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
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /^\/(media|brand|assets)\//.test(url.pathname)) return;
      event.preventDefault();
      void push(url.pathname + url.search + url.hash);
    };
    addEventListener('click', onClick);
    return () => removeEventListener('click', onClick);
  }, []);
}

export function App() {
  const pathname = usePathname();
  useDocumentMeta(pathname, pages[pathname]);
  useScrollReset(pathname);
  useClientLinks();
  usePrefetch(pathname);
  useReveal(pathname);
  useScrollEffects(pathname);

  return (
    <MotionConfig reducedMotion="user">
      <ShellHead pathname={pathname} />
      <Page key={pathname} pathname={pathname} />
      <ShellFoot />
      <PawTrail />
      <SmoothScroll />
      <RouteCurtain />
    </MotionConfig>
  );
}
