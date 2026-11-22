import { PupBuddy } from '../components/PupBuddy';

const TABS = [
  ['/', 'Home'],
  ['/puppies', 'Puppies'],
  ['/how-it-works', 'How it works'],
  ['/faq', 'Questions'],
  ['/contact', 'Contact'],
];

/** 404 page, styled as a "lost puppy" poster with tear-off tabs. */
export function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
      <div className="gutter mx-auto grid min-h-[78vh] max-w-[110rem] place-items-center py-14">
        <div className="tp-poster">
          <span aria-hidden className="tp-tape tp-tape--left" />
          <span aria-hidden className="tp-tape tp-tape--right" />
          <p className="font-scrawl tp-poster__kicker">have you seen this page?</p>
          <h1 className="font-plush tp-poster__title">
            Lost<span className="sr-only">: this page has wandered off</span>
          </h1>
          <div className="tp-poster__photo">
            <PupBuddy pose="sniff" facing="right" label="Teddy, sniffing out the missing page" />
          </div>
          <p className="tp-poster__desc">
            One page, last seen wandering off. It answers to the address you typed, but it isn't here any more. Teddy is
            on the case.
          </p>
          <p className="font-scrawl tp-poster__reward">if found, take a tab:</p>
          <ul className="tp-poster__tabs" aria-label="Pages that are here">
            {TABS.map(([href, label]) => (
              <li key={href}>
                <a className="tp-poster__tab" href={href}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
