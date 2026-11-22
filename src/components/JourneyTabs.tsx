import { useEffect, useLayoutEffect, useState } from 'react';

const tabs = () => [...document.querySelectorAll<HTMLButtonElement>('.tp-switch [role="tab"]')];
const keyOf = (tab: Element) => tab.id.replace(/^tab-/, '');

/**
 * "Two ways home" tabs on the How it works page (In Dubai / Imported).
 * Standard ARIA tabs: click or use the left and right arrow keys. The sliding
 * thumb is pure CSS, positioned from the `--at` custom property set here.
 *
 * The markup comes from the page template; this component only updates it.
 */
export function JourneyTabs() {
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Until this runs both panels stay in the document, so the content is readable without JavaScript state.
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const all = tabs();
    const select = (index: number, focus = false) => {
      const tab = all[(index + all.length) % all.length];
      setSelected(keyOf(tab));
      if (focus) tab.focus();
    };
    const cleanups = all.map((tab, index) => {
      const onClick = () => select(index);
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'ArrowRight') select(index + 1, true);
        if (event.key === 'ArrowLeft') select(index - 1, true);
      };
      tab.addEventListener('click', onClick);
      tab.addEventListener('keydown', onKey);
      return () => {
        tab.removeEventListener('click', onClick);
        tab.removeEventListener('keydown', onKey);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useLayoutEffect(() => {
    const all = tabs();
    if (!all.length) return;
    const current = selected ?? keyOf(all[0]);
    const section = document.querySelector<HTMLElement>('.tp-journeys');
    if (section) {
      if (ready) section.dataset.ready = 'true';
      else delete section.dataset.ready;
    }
    const at = Math.max(
      0,
      all.findIndex((tab) => keyOf(tab) === current),
    );
    document.querySelector<HTMLElement>('.tp-switch')?.style.setProperty('--at', String(at));
    for (const tab of all) {
      const active = keyOf(tab) === current;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(`panel-${keyOf(tab)}`);
      if (panel) panel.hidden = ready && !active;
    }
  }, [selected, ready]);

  return null;
}
