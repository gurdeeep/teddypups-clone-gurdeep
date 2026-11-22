import { useEffect, useMemo } from 'react';
import { prefersReducedMotion } from '../lib/media-query';
import { renderTemplate, textOf } from '../Template';
import shellFoot from '../templates/shell-foot.html?raw';
import shellHead from '../templates/shell-head.html?raw';
import { useHeaderBehavior } from './useHeaderBehavior';

const menu = () => document.querySelector<HTMLDialogElement>('dialog.tp-menu');

/** Closes the mobile menu after its slide-out animation (or at once for reduced motion). */
function closeMenu() {
  const dialog = menu();
  if (!dialog?.open || dialog.dataset.closing) return;
  if (prefersReducedMotion()) return dialog.close();
  dialog.dataset.closing = 'true';
  const finish = () => {
    clearTimeout(timer);
    dialog.removeEventListener('animationend', onEnd);
    if (dialog.dataset.closing) dialog.close();
  };
  const onEnd = (event: AnimationEvent) => event.target === dialog && finish();
  const timer = setTimeout(finish, 600);
  dialog.addEventListener('animationend', onEnd);
}

/** A nav link is current on its own page and on any page beneath it (e.g. a puppy profile). */
const isCurrent = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Everything above the page: transition blanket, skip link, header, desktop nav and the mobile menu. */
export function ShellHead({ pathname }: { pathname: string }) {
  useHeaderBehavior();

  useEffect(() => {
    const close = () => menu()?.close();
    addEventListener('tp:navigate', close);
    return () => removeEventListener('tp:navigate', close);
  }, []);

  return useMemo(
    () =>
      renderTemplate(shellHead, ({ el, has, render }) => {
        if (el.name === 'header') return render({ 'data-home': pathname === '/' ? 'true' : undefined });
        if (el.name === 'a' && (has('tp-nav-link') || has('tp-menu-link'))) {
          const current = isCurrent(el.attribs.href, pathname);
          return render({ 'data-active': String(current), 'aria-current': current ? 'page' : undefined });
        }
        if (el.name === 'button' && el.attribs['aria-haspopup'] === 'dialog')
          return render({ onClick: () => menu()?.showModal() });
        if (el.name === 'dialog')
          return render({
            onClick: (event: React.MouseEvent) => event.target === event.currentTarget && closeMenu(),
            onCancel: (event: React.SyntheticEvent) => {
              event.preventDefault();
              closeMenu();
            },
            onClose: (event: React.SyntheticEvent<HTMLDialogElement>) => delete event.currentTarget.dataset.closing,
          });
        if (el.name === 'button' && textOf(el) === 'Close') return render({ onClick: closeMenu });
      }),
    [pathname],
  );
}

/** Footer and the mobile WhatsApp / Call bar. */
export function ShellFoot() {
  return useMemo(() => renderTemplate(shellFoot), []);
}
