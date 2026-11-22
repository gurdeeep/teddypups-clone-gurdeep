import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { replace, usePathname, useSearch } from '../lib/router';
import { WHATSAPP_HREF } from '../lib/site';
import type { Breed, Puppy } from '../types';
import { PupBuddy } from './PupBuddy';

const FILTER_KEYS = ['origin', 'breed', 'gender', 'collection'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="tp-sticker-chip">
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">{label}</span>
      {children}
    </div>
  );
}

interface PuppyBrowserProps {
  puppies: Puppy[];
  breeds: Breed[];
  /** Ready-made card markup for each puppy, keyed by slug. */
  cards: Map<string, ReactNode>;
}

/**
 * Filterable puppy catalogue. The active filters live in the URL query string
 * (`?breed=poodle&gender=male`), so a filtered view can be shared or reloaded.
 * Cards animate to their new grid positions when the result set changes.
 */
export function PuppyBrowser({ puppies, breeds, cards }: PuppyBrowserProps) {
  const search = useSearch();
  const pathname = usePathname();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const active: Record<FilterKey, string> = {
    origin: params.get('origin') ?? '',
    breed: params.get('breed') ?? '',
    gender: params.get('gender') ?? '',
    collection: params.get('collection') ?? '',
  };

  const toggle = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && active[key] !== value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    replace(query ? `${pathname}?${query}` : pathname);
  };
  const clear = () => replace(pathname);

  const matches = useMemo(
    () =>
      puppies.filter(
        (pup) =>
          (!active.origin || pup.origin?.slug === active.origin) &&
          (!active.breed || pup.breeds.some((breed) => breed.slug === active.breed)) &&
          (!active.gender || pup.gender === active.gender || pup.gender === 'male-female') &&
          (!active.collection || pup.collections.some((collection) => collection.slug === active.collection)),
      ),
    [puppies, active.origin, active.breed, active.gender, active.collection],
  );

  const filtered = FILTER_KEYS.some((key) => active[key]);
  const breedsInStock = breeds.filter((breed) => puppies.some((pup) => pup.breeds.some((b) => b.slug === breed.slug)));
  const hasTeacup = puppies.some((pup) => pup.collections.some((collection) => collection.slug === 'korean-teacup'));
  const hasLocal = puppies.some((pup) => pup.origin?.slug === 'local');

  return (
    <div>
      <div role="group" aria-label="Filter puppies" className="tp-sketchpad flex flex-col gap-4">
        <Row label="where">
          <Chip active={!active.origin && !active.collection} onClick={clear}>
            Everywhere
          </Chip>
          {hasLocal && (
            <Chip active={active.origin === 'local'} onClick={() => toggle('origin', 'local')}>
              In Dubai
            </Chip>
          )}
          <Chip active={active.origin === 'imported'} onClick={() => toggle('origin', 'imported')}>
            Imported
          </Chip>
          {hasTeacup && (
            <Chip active={active.collection === 'korean-teacup'} onClick={() => toggle('collection', 'korean-teacup')}>
              Korean Teacup
            </Chip>
          )}
        </Row>
        <Row label="breed">
          {breedsInStock.map((breed) => (
            <Chip key={breed.slug} active={active.breed === breed.slug} onClick={() => toggle('breed', breed.slug)}>
              {breed.name}
            </Chip>
          ))}
        </Row>
        <Row label="boy or girl">
          <Chip active={active.gender === 'male'} onClick={() => toggle('gender', 'male')}>
            Boys
          </Chip>
          <Chip active={active.gender === 'female'} onClick={() => toggle('gender', 'female')}>
            Girls
          </Chip>
          {filtered && (
            <button type="button" onClick={clear} className="link-ink ml-auto text-[0.95rem] font-semibold">
              Clear filters
            </button>
          )}
        </Row>
      </div>

      <p className="font-scrawl mt-10 text-lg text-[var(--ink-soft)]" aria-live="polite">
        {matches.length === 1 ? '1 puppy' : `${matches.length} puppies`} {filtered ? 'match' : 'looking for a home'}
      </p>

      {matches.length ? (
        <div>
          <motion.ul layout className="tp-sketches mt-8">
            <AnimatePresence mode="popLayout">
              {matches.map((pup) => (
                <motion.li
                  key={pup.id}
                  layout
                  initial={{ opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                >
                  {cards.get(pup.slug)}
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      ) : (
        <div className="tp-sketchpad mt-10 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <PupBuddy pose="sit" act="tilt" className="mx-auto w-44 md:w-52" label="Teddy, tilting his head" />
          <div>
            <p className="font-plush text-big">No puppies match just now.</p>
            <p className="mt-3 max-w-[48ch] text-cocoa-soft">
              Tell us what you're hoping for and we'll let you know what's in our showroom or what we can bring in for
              you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                Ask on WhatsApp
              </a>
              <button type="button" onClick={clear} className="btn btn-ghost">
                Show all puppies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
