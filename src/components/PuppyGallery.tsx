import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Media } from '../types';
import { MediaImage } from './MediaImage';
import { NeighbourPreload, ViewerPhoto } from './PhotoViewer';

const PAGE_SIZES = '(min-width: 1024px) 55vw, 92vw';

/**
 * Photo / video gallery on a puppy profile, styled as a storybook page.
 * Changing photo "turns the page" (a clip-path wipe with a slight 3D tilt);
 * clicking the page opens the same media full screen.
 */
export function PuppyGallery({ name, media }: { name: string; media: Media[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const count = media.length;
  const current = media[index];

  const show = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [index, count],
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') show(index + 1);
      if (event.key === 'ArrowLeft') show(index - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [fullscreen, index, show]);

  if (!current) return null;
  const describe = (i: number) => `${name}, ${media[i].kind === 'video' ? 'video' : 'photo'} ${i + 1} of ${count}`;

  return (
    <div>
      <div className="tp-storypage relative aspect-[4/5] md:aspect-[5/6]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.button
            key={current.id}
            type="button"
            custom={direction}
            className="absolute inset-0 block size-full"
            initial={{
              clipPath: direction > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
              rotateY: -14 * direction,
              transformPerspective: 1400,
            }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', rotateY: 0 }}
            exit={{ opacity: 0.4, scale: 0.97 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: direction > 0 ? '0% 50%' : '100% 50%' }}
            onClick={() => {
              dialog.current?.showModal();
              setFullscreen(true);
            }}
            aria-label={`Open ${describe(index)} full screen`}
          >
            {current.kind === 'video' ? (
              <video
                src={current.url}
                poster={current.poster?.url}
                className="size-full object-cover"
                muted
                loop
                playsInline
                autoPlay
                aria-label={current.alt}
              />
            ) : (
              <MediaImage media={current} sizes={PAGE_SIZES} quality={85} eager={index === 0} />
            )}
          </motion.button>
        </AnimatePresence>
        {count > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex justify-between">
            <button
              type="button"
              onClick={() => show(index - 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <span className="self-center rounded-full bg-cocoa/80 px-3 py-1 text-sm font-semibold text-milk">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => show(index + 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Next photo"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {count > 1 && (
        <ul
          className="mt-3 flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]"
          aria-label={`All photos of ${name}`}
        >
          {media.map((item, i) => {
            const thumb = item.kind === 'video' ? item.poster : item;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => show(i)}
                  aria-label={describe(i)}
                  aria-current={i === index}
                  className={`relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 ${i === index ? '-rotate-3 -translate-y-1 border-toffee-deep' : 'border-cocoa/30 hover:-rotate-2 hover:border-cocoa'}`}
                >
                  {thumb && <MediaImage media={thumb} sizes="96px" alt="" />}
                  {item.kind === 'video' && (
                    <span className="absolute inset-0 grid place-items-center bg-cocoa/30 text-lg text-milk">▶</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={`${name} photos`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
        onClose={() => setFullscreen(false)}
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
        data-lenis-prevent
      >
        {fullscreen && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="font-scrawl text-lg">{describe(index)}</p>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 touch-pan-y">
              <motion.div
                key={current.id}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) show(index + 1);
                  else if (info.offset.x > 80) show(index - 1);
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {current.kind === 'video' ? (
                  <video
                    src={current.url}
                    poster={current.poster?.url}
                    controls
                    autoPlay
                    playsInline
                    className="size-full object-contain"
                  />
                ) : (
                  <ViewerPhoto media={current} sizes={PAGE_SIZES} quality={85} />
                )}
              </motion.div>
              <NeighbourPreload photos={media} at={index} />
            </div>
            {count > 1 && (
              <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <button
                  type="button"
                  onClick={() => show(index - 1)}
                  className="h-12 rounded-full border-2 border-milk px-6 font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => show(index + 1)}
                  className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
