import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, InputHTMLAttributes } from 'react';
import { useEnquiry } from '../lib/enquiry';
import { prefersReducedMotion } from '../lib/media-query';
import { ENQUIRY_SUCCESS, WHATSAPP_HREF } from '../lib/site';
import type { EnquiryOption } from '../types';
import { PawIcon } from './PawIcon';

interface BlankProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  error?: string;
  /** Width of the blank, in characters. */
  width?: number;
}

/** A fill-in-the-blank input that sits inline in the letter's sentences. */
function Blank({ name, label, error, width = 14, ...input }: BlankProps) {
  return (
    <span className="tp-blank" style={{ '--size': `${width}ch` } as CSSProperties}>
      <input
        name={name}
        aria-label={label}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${name}-err` : undefined}
        {...input}
      />
    </span>
  );
}

type Phase = 'writing' | 'sealing' | 'posting' | 'sent';

/**
 * Contact page form, written as a letter with blanks to fill in.
 * On success it plays a short scene: the envelope seals (750ms), drops into a
 * post box (1s), then a confirmation takes the form's place.
 */
export function LetterForm({ puppies }: { puppies: EnquiryOption[] }) {
  const { state, pending, onSubmit, ref } = useEnquiry();
  const [phase, setPhase] = useState<Phase>('writing');
  const box = useRef<HTMLDivElement>(null);
  const [heldHeight, setHeldHeight] = useState<number>();
  const selectId = useId();
  const noteId = useId();
  const sent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    const timers = prefersReducedMotion()
      ? [setTimeout(() => setPhase('sent'), 0)]
      : [
          setTimeout(() => {
            // Hold the box height so the page does not jump while the scene plays.
            setHeldHeight(box.current?.offsetHeight);
            setPhase('sealing');
          }, 0),
          setTimeout(() => setPhase('posting'), 750),
          setTimeout(() => {
            setHeldHeight(undefined);
            setPhase('sent');
          }, 1750),
        ];
    return () => timers.forEach(clearTimeout);
  }, [state.ok]);

  // Move focus to the confirmation and make sure it is not under the header.
  useEffect(() => {
    const element = sent.current;
    if (phase !== 'sent' || !element) return;
    element.focus({ preventScroll: true });
    const top = element.getBoundingClientRect().top;
    const header = 16 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    if (top < header + 8) scrollBy({ top: top - header - 24, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [phase]);

  useEffect(() => {
    if (!state.ok && state.errors) ref.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus();
  }, [state, ref]);

  const errors = state.errors ?? {};
  const listed = Object.entries(errors);

  return (
    <div ref={box} className="tp-post" data-phase={phase} style={{ minHeight: heldHeight }}>
      {phase !== 'sent' && (
        <form
          ref={ref}
          onSubmit={onSubmit}
          noValidate
          className="tp-letterform"
          aria-hidden={phase !== 'writing' || undefined}
          inert={phase !== 'writing'}
        >
          <span aria-hidden className="tp-letter__stamp">
            <PawIcon className="size-9" />
          </span>
          <p className="font-scrawl tp-letterform__greeting">Dear TeddyPups,</p>
          {state.message && !state.ok && (
            <div role="alert" className="tp-letterform__alert">
              <p className="font-semibold">{state.message}</p>
              {listed.length > 0 && (
                <ul>
                  {listed.map(([field, text]) => (
                    <li key={field} id={`${field}-err`}>
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="tp-letterform__line">
            my name is{' '}
            <Blank
              name="name"
              label="Your name (required)"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              width={16}
              error={errors.name}
            />
            , and you can reach me on{' '}
            <Blank
              name="phone"
              label="Phone or WhatsApp number with country code (required)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              width={15}
              placeholder="+971 50 123 4567"
              error={errors.phone}
            />{' '}
            or by email at{' '}
            <Blank
              name="email"
              label="Email (optional)"
              type="email"
              autoComplete="email"
              width={20}
              placeholder="optional"
              error={errors.email}
            />
            .
          </p>
          <p className="tp-letterform__line">
            I live in{' '}
            <Blank
              name="area"
              label="Your area (optional)"
              autoComplete="address-level2"
              maxLength={80}
              width={13}
              placeholder="e.g. Dubai Marina"
              error={errors.area}
            />
            , and I'm curious about{' '}
            <span className="tp-blank tp-blank--select">
              <label htmlFor={selectId} className="sr-only">
                Puppy you're interested in (optional)
              </label>
              <select id={selectId} name="puppyId" defaultValue="">
                <option value="">any puppy (not sure yet)</option>
                {puppies.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
            .
          </p>
          <label htmlFor={noteId} className="sr-only">
            Your message (optional)
          </label>
          <textarea
            id={noteId}
            name="message"
            rows={4}
            maxLength={2000}
            placeholder="Anything else you'd like to tell us…"
            className="tp-letterform__note"
            aria-invalid={!!errors.message || undefined}
          />
          {/* Honeypot: hidden from people, tempting to bots. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <div className="tp-letterform__sign">
            <p className="font-scrawl">with love, a future puppy parent</p>
            <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-70">
              {pending ? 'Sealing the envelope…' : 'Post my letter'}
            </button>
          </div>
        </form>
      )}

      {(phase === 'sealing' || phase === 'posting') && (
        <div aria-hidden className="tp-post__scene">
          <svg viewBox="0 0 160 112" className="tp-post__envelope">
            <rect x="4" y="18" width="152" height="90" rx="6" fill="#fffdf8" stroke="#2a170e" strokeWidth="4" />
            <path d="M6 104 64 62M154 104 96 62" fill="none" stroke="#2a170e" strokeWidth="3" strokeLinecap="round" />
            <path
              className="tp-post__flap"
              d="M6 22 80 74 154 22"
              fill="#fbe3b4"
              stroke="#2a170e"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="80" cy="72" r="11" fill="#a24a1a" stroke="#2a170e" strokeWidth="3" />
          </svg>
          <svg viewBox="0 0 200 260" className="tp-post__box">
            <rect x="86" y="170" width="28" height="86" fill="#5a3a28" stroke="#2a170e" strokeWidth="4" />
            <path
              d="M30 70a70 54 0 0 1 140 0v104H30z"
              fill="#c2622b"
              stroke="#2a170e"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <rect x="58" y="86" width="84" height="14" rx="7" fill="#2a170e" />
            <path d="M44 128h112" stroke="#2a170e" strokeWidth="3" strokeLinecap="round" opacity=".35" />
            <g className="tp-post__flag">
              <path d="M170 120V64" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
              <path d="M170 64h22v16h-22" fill="#f2be6b" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      )}

      {phase === 'sent' && (
        <div ref={sent} tabIndex={-1} role="status" className="tp-post__sent">
          <svg viewBox="0 0 200 150" aria-hidden className="tp-post__box tp-post__box--sent">
            <rect x="86" y="96" width="28" height="52" fill="#5a3a28" stroke="#2a170e" strokeWidth="4" />
            <path
              d="M30 50a70 44 0 0 1 140 0v52H30z"
              fill="#c2622b"
              stroke="#2a170e"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <rect x="58" y="58" width="84" height="12" rx="6" fill="#2a170e" />
            <path d="M170 92V22" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
            <path d="M170 22h22v16h-22" fill="#f2be6b" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <p className="font-plush mt-4 text-[2rem]">{ENQUIRY_SUCCESS.heading}</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-cocoa-soft">{ENQUIRY_SUCCESS.body}</p>
          <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
            WhatsApp us
          </a>
        </div>
      )}
    </div>
  );
}
