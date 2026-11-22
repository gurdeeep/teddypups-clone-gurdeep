import { useEffect } from 'react';
import { scroll } from 'motion';
import { useReducedMotion } from './media-query';

/**
 * Scroll-linked decorations that exist on several pages. Both are driven by
 * Motion's `scroll()`, which reports how far an element has travelled through
 * the viewport as a 0..1 progress value.
 */
export function useScrollEffects(pathname: string) {
  const reduced = useReducedMotion();

  // The Korea → Dubai plane follows its dotted SVG route as the section scrolls by.
  useEffect(() => {
    const stops: (() => void)[] = [];
    for (const container of document.querySelectorAll<HTMLElement>('.tp-flight')) {
      const route = container.querySelector<SVGPathElement>('.tp-flight__route');
      const plane = container.querySelector<SVGGElement>('svg > g');
      if (!route || !plane) continue;
      const place = (progress: number) => {
        const length = route.getTotalLength();
        const at = Math.min(length, Math.max(0, progress * length));
        const point = route.getPointAtLength(at);
        // Sample just ahead and behind to get the direction of travel.
        const ahead = route.getPointAtLength(Math.min(length, at + 1));
        const behind = route.getPointAtLength(Math.max(0, at - 1));
        const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
        plane.setAttribute(
          'transform',
          `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${angle.toFixed(1)})`,
        );
        plane.style.opacity = String(Math.min(1, Math.max(0, (progress - 0.11) / 0.06)));
      };
      if (reduced) place(0.62);
      else
        stops.push(
          scroll((progress: number) => place(progress), { target: container, offset: ['start 95%', 'end 25%'] }),
        );
    }
    return () => stops.forEach((stop) => stop());
  }, [pathname, reduced]);

  // The brown bookmark ribbon down the side of a puppy profile fills as you read.
  useEffect(() => {
    const ribbon = document.querySelector<HTMLElement>('.tp-ribbon');
    const band = ribbon?.querySelector<HTMLElement>('.tp-ribbon__band');
    if (!ribbon || !band) return;
    return scroll((progress: number) => (band.style.transform = progress === 1 ? 'none' : `scaleY(${progress})`), {
      target: ribbon,
      offset: ['start 30%', 'end end'],
    });
  }, [pathname]);
}
