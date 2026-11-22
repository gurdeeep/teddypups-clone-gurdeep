import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { responsive } from '../lib/image';
import type { Media } from '../types';
import { MediaImage } from './MediaImage';

const FILL: CSSProperties = { position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' };

/** One full-screen photo: the blurred preview first, then the sharp file fades in over it. */
export function ViewerPhoto({ media, sizes, quality = 75 }: { media: Media; sizes?: string; quality?: number }) {
  const [sharp, setSharp] = useState(false);
  return (
    <>
      <MediaImage
        media={media}
        alt=""
        eager
        sizes={sizes}
        quality={quality}
        className={sharp ? 'tp-viewer__first tp-viewer__first--done' : 'tp-viewer__first'}
        style={{ objectFit: 'contain', objectPosition: '50% 50%', backgroundColor: 'transparent' }}
      />
      <img
        {...responsive(media.url, { sizes: '100vw', quality })}
        alt={media.alt}
        loading="eager"
        decoding="async"
        data-nimg="fill"
        className="tp-viewer__sharp object-contain"
        data-sharp={sharp || undefined}
        style={FILL}
        onLoad={(event) => {
          event.currentTarget
            .decode()
            .catch(() => {})
            .then(() => setSharp(true));
        }}
      />
    </>
  );
}

/** Quietly loads the previous and next photos so paging feels instant. */
export function NeighbourPreload({ photos, at }: { photos: Media[]; at: number }) {
  const count = photos.length;
  if (count < 2) return null;
  const neighbours = [...new Set([(at - 1 + count) % count, (at + 1) % count])].filter(
    (i) => photos[i].kind === 'image',
  );
  return (
    <span aria-hidden className="sr-only">
      {neighbours.map((i) => (
        <img
          key={photos[i].id}
          src={photos[i].url}
          alt=""
          loading="eager"
          decoding="async"
          data-nimg="fill"
          style={FILL}
        />
      ))}
    </span>
  );
}

const slide = {
  enter: (direction: number) => ({ opacity: 0, x: 70 * direction, rotate: 5 * direction, scale: 0.92 }),
  center: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 26 } as const,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: -70 * direction,
    rotate: -5 * direction,
    scale: 0.92,
    transition: { duration: 0.22 },
  }),
};

/**
 * Full-screen photo viewer used by the family photo walls.
 * Returns `open(index)` plus the dialog element to render once on the page.
 * Arrow keys, the Previous / Next buttons and horizontal drags all page through.
 */
export function usePhotoViewer(photos: Media[], sizes?: string) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const count = photos.length;
  const wrap = useCallback((i: number) => ((i % count) + count) % count, [count]);
  const go = useCallback(
    (i: number, towards: number) => {
      setDirection(towards);
      setIndex(wrap(i));
    },
    [wrap],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(index + 1, 1);
      if (event.key === 'ArrowLeft') go(index - 1, -1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [index, go]);

  const photo = index === null ? null : photos[index];
  const open = (i: number) => {
    setDirection(1);
    setIndex(i);
    dialog.current?.showModal();
  };

  const viewer = (
    <dialog
      ref={dialog}
      aria-label="Photo viewer"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      onClose={() => setIndex(null)}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      data-lenis-prevent
    >
      {photo && index !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">
              {index + 1} / {count}
              {photo.caption ? ` — ${photo.caption}` : ''}
            </p>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa"
            >
              Close
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={photo.id}
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 touch-pan-y"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) go(index + 1, 1);
                  else if (info.offset.x > 80) go(index - 1, -1);
                }}
              >
                <ViewerPhoto media={photo} sizes={sizes} />
              </motion.div>
            </AnimatePresence>
            <NeighbourPreload photos={photos} at={index} />
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={() => go(index - 1, -1)}
              className="h-12 rounded-full border-2 border-milk px-6 font-semibold"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, 1)}
              className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  return { open, viewer };
}
