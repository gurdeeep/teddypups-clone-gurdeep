import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { MediaImage } from '../components/MediaImage';
import { prefersReducedMotion } from '../lib/media-query';
import type { Puppy } from '../types';

/** Each seat behind the quilt: [x %, width rem, how far it peeks, tilt deg]. */
const SEATS = [
  [9, 8.6, 0.62, -5],
  [22.5, 10.4, 0.8, 3],
  [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3],
  [77.5, 10.6, 0.82, -3],
  [91, 8.4, 0.6, 4],
];
/** Pause before the next swap, cycled so the rhythm never feels mechanical. */
const PAUSES = [1900, 2500, 1700, 2300, 2000, 2800, 1800];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type SeatState = 'duck' | 'pop' | undefined;

/**
 * Row of puppies peeking over the hero quilt.
 *
 * Six seats, more puppies than seats: every couple of seconds one puppy ducks
 * down, a waiting puppy takes the seat and pops up with a name tag. The next
 * puppy's photo is preloaded off screen ("in the wings") so the swap never
 * shows a half-loaded image. Swaps pause while the user scrolls, hovers, or
 * the hero is off screen.
 */
export function HeroLineup({ friends }: { friends: Puppy[] }) {
  const seatCount = Math.min(SEATS.length, friends.length);
  const [seated, setSeated] = useState(() => friends.slice(0, seatCount).map((_, i) => i));
  const [states, setStates] = useState<Record<number, SeatState>>({});
  const [announced, setAnnounced] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [waiting, setWaiting] = useState<number | null>(friends.length > seatCount ? seatCount : null);
  const list = useRef<HTMLUListElement>(null);
  const wings = useRef<HTMLSpanElement>(null);
  const seatedNow = useRef(seated);

  useEffect(() => {
    seatedNow.current = seated;
  }, [seated]);

  useEffect(() => {
    const element = list.current;
    if (!element || !seatCount || prefersReducedMotion()) return;
    const canSwap = friends.length > seatCount;
    const scene = element.closest<HTMLElement>('[data-pup-scene]');
    let onScreen = true;
    let quietUntil = 0;
    let alive = true;
    const visibility = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.35 });
    visibility.observe(element);
    const hush = () => (quietUntil = performance.now() + 1200);
    addEventListener('scroll', hush, { passive: true });
    addEventListener('pointerdown', hush, { passive: true });
    element.addEventListener('pointerover', hush, { passive: true });

    const unseated = () => friends.map((_, i) => i).filter((i) => !seatedNow.current.includes(i));
    const initial = unseated();
    let queue = initial.includes(seatCount)
      ? [seatCount, ...shuffle(initial.filter((i) => i !== seatCount))]
      : shuffle(initial);
    let seatOrder: number[] = [];
    let lastSeat = -1;
    let turn = 0;
    let retries = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const later = (callback: () => void, ms: number) => timers.push(setTimeout(callback, ms));

    const attempt = () => {
      const idle = !document.hidden && onScreen && performance.now() > quietUntil && scene?.dataset.here !== 'false';
      if (!idle) return later(attempt, 900);
      if (!canSwap) return swap();
      if (!queue.length) queue = shuffle(unseated());
      const image = wings.current?.dataset.for === String(queue[0]) ? wings.current.querySelector('img') : null;
      if (!image || !image.complete || !image.naturalWidth) {
        if (++retries < 15) return later(attempt, 400);
        // That photo is taking too long: send it to the back of the queue.
        queue.push(queue.shift()!);
        setWaiting(queue[0] ?? null);
        retries = 0;
        return later(attempt, 800);
      }
      retries = 0;
      image.decode().then(swap, swap);
    };

    const swap = () => {
      if (!seatOrder.length) {
        seatOrder = shuffle(
          [...element.children].map((seat, i) => (seat.getClientRects().length ? i : -1)).filter((i) => i >= 0),
        ).filter((seat, i, all) => !(i === 0 && seat === lastSeat && all.length > 1));
      }
      const seat = seatOrder.shift();
      if (seat === undefined) return later(attempt, 2000);
      lastSeat = seat;
      const incoming = canSwap ? queue.shift()! : seatedNow.current[seat];
      setStates((current) => ({ ...current, [seat]: 'duck' }));
      later(() => {
        if (canSwap) {
          const outgoing = seatedNow.current[seat];
          setSeated((current) => current.map((friend, i) => (i === seat ? incoming : friend)));
          queue.push(outgoing);
          setWaiting(queue[0] ?? null);
        }
        setStates((current) => ({ ...current, [seat]: 'pop' }));
        setAnnounced(seat);
        later(() => setAnnounced((current) => (current === seat ? null : current)), 1800);
        later(() => setStates((current) => ({ ...current, [seat]: undefined })), 700);
      }, 360);
      later(attempt, PAUSES[turn++ % PAUSES.length]);
    };

    if (canSwap) setWaiting(queue[0] ?? null);
    // Wait for the entrance ("peek") animations before the first swap.
    const entrances = [...element.querySelectorAll('.tp-lineup__pup')]
      .flatMap((pup) => pup.getAnimations())
      .filter((animation) => (animation as CSSAnimation).animationName === 'tp-peek');
    const start = () => alive && later(attempt, 250);
    Promise.all(entrances.map((animation) => animation.finished)).then(start, start);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      timers = [];
      visibility.disconnect();
      removeEventListener('scroll', hush);
      removeEventListener('pointerdown', hush);
      element.removeEventListener('pointerover', hush);
    };
  }, [friends, seatCount]);

  if (!seatCount) return null;
  const seatStyle = (seat: number) => {
    const [x, width, peek, tilt] = SEATS[seat];
    return {
      '--x': `${x}%`,
      '--w': `${width}rem`,
      '--peek': peek,
      '--tilt': `${tilt}deg`,
      '--i': seat,
    } as CSSProperties;
  };
  const unhover = (seat: number) => () => setHovered((current) => (current === seat ? null : current));

  return (
    <>
      <ul ref={list} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {seated.map((friendIndex, seat) => {
          const pup = friends[friendIndex];
          return (
            <li key={seat} className="tp-lineup__seat" style={seatStyle(seat)}>
              <a
                href={`/puppies/${pup.slug}`}
                className="tp-lineup__pup"
                data-pup-friend
                data-state={states[seat]}
                aria-label={`Meet ${pup.displayName}, ${pup.breed}`}
                onPointerEnter={() => setHovered(seat)}
                onPointerLeave={unhover(seat)}
                onFocus={() => setHovered(seat)}
                onBlur={unhover(seat)}
              >
                <span className="tp-lineup__photo">
                  <MediaImage key={pup.id} media={pup.cover} eager />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <ul aria-hidden className="tp-lineup tp-lineup--tags">
        {seated.map((friendIndex, seat) => (
          <li key={seat} className="tp-lineup__seat" style={seatStyle(seat)}>
            <span
              className="tp-lineup__ghost"
              data-state={states[seat]}
              data-tag={announced === seat || hovered === seat ? 'show' : undefined}
            >
              <span className="tp-lineup__name font-scrawl">{friends[friendIndex].displayName}</span>
            </span>
          </li>
        ))}
      </ul>
      {waiting !== null && (
        <span ref={wings} aria-hidden className="tp-lineup__wings" data-for={waiting}>
          <MediaImage media={friends[waiting].cover} alt="" eager />
        </span>
      )}
    </>
  );
}
