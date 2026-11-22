import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { cancelFrame, frame } from 'motion';
import { useReducedMotion } from '../lib/media-query';
import { PupSvg, PuppyDriver, pickPupAct, pupActs, restPoses, spawnHearts } from '../motion/reference-motion';
import type { PupActContext, PupCue, PupFacing, PupPose } from '../motion/reference-motion';

interface PupBuddyProps {
  pose?: PupPose;
  facing?: PupFacing;
  /** `tilt` makes the puppy slowly cock its head from side to side. */
  act?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** A "stop" is a resting place for the homepage's walking puppy; it stays still while that puppy is live. */
  asStop?: boolean;
}

/** Tricks a puppy can do when clicked, for the poses that only show its head. */
const PEEK_ACTS = ['peekaboo', 'woof', 'tilt', 'sneeze'];
const SNUG_ACTS = ['tilt', 'love', 'sneeze', 'woof'];

const nowSeconds = () => performance.now() / 1000;

/**
 * Teddy, the site mascot. The SVG and its physics come from the animation
 * engine; this component decides *when* things happen: eyes follow the mouse,
 * hovering pets him, clicking plays a trick, and every nine idle seconds he
 * tilts his head or wags. He pauses while off screen.
 */
export function PupBuddy({
  pose = 'sit',
  facing = 'right',
  act,
  label,
  className = '',
  style,
  asStop = false,
}: PupBuddyProps) {
  const root = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const element = root.current!;
    const speech = bubble.current!;
    const direction = facing === 'left' ? -1 : 1;
    const driver = new PuppyDriver(element.querySelector('svg')!, pose, direction);
    driver.wag(0.6);

    let cues: PupCue[] = [];
    let last = nowSeconds();
    let idleSince = last;
    let speechUntil = 0;
    let pointer: { x: number; y: number; t: number } | null = null;
    let lastAct: string | null = null;
    let streak = 0;
    let lastClick = 0;
    let playing = false;
    let playUntil = 0;

    const context: PupActContext = {
      d: driver,
      rest: restPoses[pose],
      facing: direction,
      say: (text, seconds = 1.4) => {
        speech.textContent = text;
        speech.dataset.show = 'true';
        speechUntil = nowSeconds() + seconds;
      },
      hearts: () =>
        spawnHearts(element, element.clientWidth * (direction > 0 ? 0.7 : 0.3), element.clientHeight * 0.25),
    };

    const tick = () => {
      const now = nowSeconds();
      const delta = Math.min(0.05, now - last);
      last = now;
      while (cues.length && cues[0][0] <= now) cues.shift()![1](now);
      if (playing !== now < playUntil) {
        playing = !playing;
        element.toggleAttribute('data-playing', playing);
      }
      driver.lookAt(pointer && now - pointer.t < 3 ? pointer : null);
      if (act === 'tilt' && !cues.length) {
        const sway = Math.sin(now * 0.9);
        driver.cock(sway > 0.35 ? 13 : sway < -0.35 ? -10 : 0);
      }
      if (!cues.length && now - idleSince > 9) {
        idleSince = now;
        cues =
          Math.random() < 0.5
            ? pupActs.tilt(context, now)
            : [
                [now, () => driver.wag(1)],
                [now + 2.2, () => driver.wag(0.6)],
              ];
      }
      if (speech.dataset.show === 'true' && now > speechUntil) speech.dataset.show = 'false';
      driver.tick(delta, now);
    };

    let running = false;
    const setRunning = (wanted: boolean) => {
      const next = asStop && document.documentElement.dataset.pup ? false : wanted;
      if (next === running) return;
      running = next;
      if (next) {
        last = nowSeconds();
        frame.update(tick, true);
      } else cancelFrame(tick);
    };
    const visibility = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting));
    visibility.observe(element);

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') pointer = { x: event.clientX, y: event.clientY, t: nowSeconds() };
    };
    const onClick = () => {
      const now = nowSeconds();
      streak = now - lastClick < 0.7 ? streak + 1 : 1;
      lastClick = now;
      const fixed = pose === 'peek' ? PEEK_ACTS : pose === 'snug' ? SNUG_ACTS : null;
      const choices = fixed?.filter((name) => name !== lastAct) ?? [];
      const name = fixed ? choices[Math.floor(Math.random() * choices.length)] : pickPupAct(lastAct, streak);
      lastAct = name;
      driver.reset();
      cues = pupActs[name](context, now);
      playUntil = cues[cues.length - 1][0] + 0.4;
      idleSince = now;
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      driver.petting(true);
      driver.wag(1);
    };
    const onLeave = () => {
      driver.petting(false);
      driver.wag(0.6);
    };

    addEventListener('pointermove', onPointerMove, { passive: true });
    element.addEventListener('click', onClick);
    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointerleave', onLeave);
    return () => {
      setRunning(false);
      cancelFrame(tick);
      element.removeAttribute('data-playing');
      visibility.disconnect();
      removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('click', onClick);
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, pose, facing, act, asStop]);

  return (
    <div
      ref={root}
      className={`pup-buddy ${className}`}
      style={style}
      data-live={reduced ? undefined : ''}
      data-facing={facing}
    >
      <PupSvg key={String(reduced)} pose={pose} facing={facing} label={label} />
      <span ref={bubble} aria-hidden className="pup-bubble" data-show="false" />
    </div>
  );
}
