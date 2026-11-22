import { Fragment, useId, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { WHATSAPP_HREF } from '../lib/site';
import type { Faq } from '../types';
import { PupBuddy } from './PupBuddy';

const TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.7, -1.9, 1.4];
const PINS = ['var(--color-toffee)', 'var(--color-sky-deep)', '#d9a13c', '#c45a6a'];

/** Wraps every occurrence of the search term in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}</>;
}

/**
 * FAQ page: questions pinned to a cork board as folded notes.
 * One note unfolds at a time. Typing in the search box filters the notes,
 * highlights the term, and unfolds any note whose *answer* contains it.
 */
export function NoticeBoard({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const inputId = useId();
  const term = query.trim().toLowerCase();
  const shown = useMemo(
    () => (term ? faqs.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(term)) : faqs),
    [faqs, term],
  );

  return (
    <div className="tp-notes" data-open={openId || term ? '' : undefined}>
      <aside className="tp-notes__side" aria-label="Find a question">
        <label htmlFor={inputId} className="font-scrawl tp-notes__label">
          sniff out a question
        </label>
        <div className="tp-notes__search">
          <svg viewBox="0 0 24 24" aria-hidden className="tp-notes__lens">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="delivery, Korea, vaccinated…"
            autoComplete="off"
          />
        </div>
        <p className="tp-notes__count" aria-live="polite">
          {query.trim()
            ? `${shown.length} ${shown.length === 1 ? 'note' : 'notes'} found`
            : `${faqs.length} notes on the board`}
        </p>
        <div className="tp-notes__teddy">
          <span aria-hidden className="tp-notes__bubble font-plush">
            <span className="tp-notes__q">?</span>
            <span className="tp-notes__a">!</span>
          </span>
          <PupBuddy pose="sit" act="tilt" label="Teddy, reading the notes" />
        </div>
        <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-notes__ask">
          Ask your own question
        </a>
      </aside>

      <div className="tp-notes__board">
        <ul className="tp-notes__list">
          {shown.map((faq, i) => {
            const unfolded = openId === faq.id || (!!term && faq.answer.toLowerCase().includes(term));
            return (
              <li
                key={faq.id}
                className="tp-note"
                data-reveal
                data-unfolded={unfolded || undefined}
                style={
                  {
                    '--tilt': `${TILTS[i % TILTS.length]}deg`,
                    '--pin': PINS[i % PINS.length],
                    '--i': i,
                  } as CSSProperties
                }
              >
                <span aria-hidden className="tp-note__pin" />
                <h2 className="tp-note__q">
                  <button
                    type="button"
                    id={`q-${faq.id}`}
                    aria-expanded={unfolded}
                    aria-controls={`a-${faq.id}`}
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  >
                    <span className="font-plush-text">
                      <Highlight text={faq.question} query={query} />
                    </span>
                    <span aria-hidden className="tp-note__chevron" />
                  </button>
                </h2>
                <div
                  id={`a-${faq.id}`}
                  role="region"
                  aria-labelledby={`q-${faq.id}`}
                  className="tp-note__answer"
                  inert={!unfolded}
                >
                  <div className="tp-note__flap">
                    <p>
                      <Highlight text={faq.answer} query={query} />
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!shown.length && (
          <div className="tp-note tp-note--empty">
            <span aria-hidden className="tp-note__pin" />
            <p className="font-plush-text text-[1.2rem] font-bold">No note about “{query.trim()}” yet.</p>
            <p className="mt-2">
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="link-ink">
                Ask us on WhatsApp
              </a>{' '}
              and we'll answer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
