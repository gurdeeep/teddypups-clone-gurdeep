import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMediaQuery, useReducedMotion } from '../lib/media-query';
import { cuePup } from '../motion/reference-motion';

const toggle = (element: Element, name: string, on: boolean) =>
  on ? element.setAttribute(name, 'true') : element.removeAttribute(name);

/**
 * "Your puppy journey": three steps on the left, a WhatsApp-style phone on the
 * right. On desktop, scrolling a step into the middle band of the viewport
 * makes the phone show "typing…" for 750ms and then reveal that step's
 * messages. On mobile and for reduced-motion users everything is shown.
 *
 * The markup comes from the page template; this component only updates it.
 */
export function ChatStory() {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const reduced = useReducedMotion();
  const showEverything = reduced || !desktop;
  const [step, setStep] = useState(-1);
  const [typing, setTyping] = useState(false);
  const previous = useRef(-1);

  useEffect(() => {
    const list = document.querySelector('.tp-chat__steps');
    if (showEverything || !list) return;
    const items = [...list.children];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setStep(items.indexOf(entry.target));
      },
      { rootMargin: '-28% 0px -62% 0px' },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [showEverything]);

  // Moving forward to a new step: type first, then show the reply and nudge the puppy.
  useEffect(() => {
    if (showEverything) return;
    const forward = step > previous.current;
    previous.current = step;
    if (!forward || step < 0) return;
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      const group = document.querySelector(`.tp-phone__screen [data-step="${step}"]`);
      if (group)
        cuePup({ look: group, secs: 1.4, say: step === 1 ? 'ooh, photos!' : step === 2 ? 'home soon!' : undefined });
    }, 750);
    return () => clearTimeout(timer);
  }, [step, showEverything]);

  useLayoutEffect(() => {
    const steps = [...(document.querySelector('.tp-chat__steps')?.children ?? [])];
    const current = showEverything ? steps.length - 1 : step;
    steps.forEach((item, i) => {
      toggle(item, 'data-active', i === current);
      toggle(item, 'data-done', i < current);
    });
    document.querySelectorAll<HTMLElement>('.tp-phone__screen .tp-msg-group').forEach((group, i) => {
      group.dataset.show = i < current || (i === current && !typing) ? 'true' : 'false';
    });
    const dots = document.querySelector<HTMLElement>('.tp-typing');
    if (dots) dots.dataset.show = typing ? 'true' : 'false';
    const status = document.querySelector('.tp-phone__status');
    if (status) status.textContent = typing ? 'typing…' : 'online';
  }, [step, typing, showEverything]);

  return null;
}

/** The short looping puppy video inside the chat, with its own play / pause button. */
export function ChatClip({ src, poster, label }: { src: string; poster?: string; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const onToggle = () => {
    const element = video.current;
    if (!element) return;
    if (element.paused)
      element
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    else {
      element.pause();
      setPlaying(false);
    }
  };
  return (
    <div className="tp-clip">
      <video
        ref={video}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        className="tp-clip__play"
        onClick={onToggle}
        aria-pressed={playing}
        aria-label={playing ? 'Pause video' : 'Play video'}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
        </svg>
      </button>
    </div>
  );
}
