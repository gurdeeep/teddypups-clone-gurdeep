import { useLayoutEffect, useRef, useState } from 'react';
import { useScroll, useSpring, useTransform } from 'motion/react';
import { useReducedMotion } from '../lib/media-query';
import { cuePup } from '../motion/reference-motion';

interface Nodes {
  section: HTMLElement;
  range: HTMLElement;
  track: HTMLElement;
  hall: HTMLElement;
}

/**
 * "Meet the pups": a row of doors that scrolls sideways while the section is
 * pinned (desktop only). The markup comes from the page template; this
 * component finds it and drives it.
 */
export function MeetShowcase() {
  const [nodes, setNodes] = useState<Nodes | null>(null);
  useLayoutEffect(() => {
    const section = document.querySelector<HTMLElement>('.tp-meet');
    const range = section?.querySelector<HTMLElement>('[data-pin-range]');
    const track = section?.querySelector<HTMLElement>('.tp-meet__track');
    const hall = section?.querySelector<HTMLElement>('.tp-meet__hall');
    if (section && range && track && hall) setNodes({ section, range, track, hall });
  }, []);
  return nodes ? <PinnedTrack {...nodes} /> : null;
}

function PinnedTrack({ section, range, track, hall }: Nodes) {
  const rangeRef = useRef(range);
  const reduced = useReducedMotion();
  const [travel, setTravel] = useState(0);
  const [pinned, setPinned] = useState(false);

  // Size the doors to the viewport and measure how far the track must travel.
  useLayoutEffect(() => {
    const measure = () => {
      const desktop = matchMedia('(min-width: 1024px)').matches;
      setPinned(desktop && !reduced);
      if (desktop && !reduced) {
        const stage = hall.parentElement!;
        const head = stage.querySelector<HTMLElement>('.tp-meet__head');
        const plate = Math.max(
          64,
          ...[...track.querySelectorAll<HTMLElement>('.tp-door__plate')].map((element) => element.offsetHeight),
        );
        const floor = hall.querySelector<HTMLElement>('.tp-meet__floor')?.offsetHeight ?? 0;
        const headBottom = head ? head.offsetTop + head.offsetHeight : 0;
        const width = Math.max(
          128,
          Math.min(256, 0.15 * innerWidth, (stage.clientHeight - headBottom - floor - plate - 40) / 1.3),
        );
        hall.style.setProperty('--door-w', `${width.toFixed(0)}px`);
      } else hall.style.removeProperty('--door-w');
      setTravel(Math.max(0, track.scrollWidth - innerWidth));
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    if (hall.parentElement) resize.observe(hall.parentElement);
    addEventListener('resize', measure);
    return () => {
      resize.disconnect();
      removeEventListener('resize', measure);
    };
  }, [reduced, hall, track]);

  // Vertical scroll progress through the pinned range, smoothed by a spring, mapped to x.
  const { scrollYProgress } = useScroll({ target: rangeRef, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 170, damping: 32, mass: 0.35 });
  const x = useTransform(smooth, [0, 1], [0, -travel]);

  useLayoutEffect(() => {
    if (pinned) section.dataset.pinned = 'true';
    else delete section.dataset.pinned;
    range.style.height = pinned ? `calc(100vh + ${Math.round(0.8 * travel)}px)` : '';
    range.style.setProperty('--pinned', pinned ? '1' : '0');
    for (const door of track.querySelectorAll<HTMLElement>('.tp-door:not(.tp-door--all)'))
      door.dataset.open = pinned ? 'false' : 'true';
    const teddy = section.querySelector<HTMLElement>('.tp-meet__teddy');
    if (teddy) {
      teddy.dataset.pose = pinned ? 'walk' : 'sit';
      if (pinned) teddy.dataset.act = 'treadmill';
      else delete teddy.dataset.act;
    }
    if (!pinned) {
      track.style.transform = '';
      return;
    }
    // A door swings open once it passes 36% of the viewport width.
    const update = (offset: number, announce: boolean) => {
      hall.style.setProperty('--floor-x', `${offset.toFixed(1)}px`);
      const line = 0.36 * innerWidth;
      for (const door of track.children as HTMLCollectionOf<HTMLElement>) {
        const open = door.offsetLeft + offset < line;
        if ((door.dataset.open === 'true') !== open) {
          door.dataset.open = String(open);
          if (open && announce) cuePup({ look: door, secs: 0.9 });
        }
      }
    };
    const place = (offset: number) => (track.style.transform = offset ? `translateX(${offset}px)` : 'none');
    place(x.get());
    update(x.get(), false);
    return x.on('change', (offset) => {
      place(offset);
      update(offset, true);
    });
  }, [pinned, travel, x, section, range, track, hall]);

  return null;
}
