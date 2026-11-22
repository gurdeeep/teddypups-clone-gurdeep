import { useSyncExternalStore } from 'react';
import pagesJson from '../data/pages.json';

export interface PageMeta {
  template: string;
  title: string;
  htmlClass: string;
  description?: string;
  ogTitle?: string;
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd?: unknown;
}

export const pages = pagesJson as Record<string, PageMeta>;

/** Each page template is its own chunk, fetched the first time its route is visited. */
const loaders = import.meta.glob<string>(['../templates/*.html', '!../templates/shell-*.html'], {
  query: '?raw',
  import: 'default',
});
const cache = new Map<string, string>();

export const normalisePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

/** Fetches (once) the markup for a route. Unknown routes resolve to nothing. */
export async function preloadPage(pathname: string) {
  const page = pages[normalisePath(pathname)];
  if (!page || cache.has(page.template)) return;
  const load = loaders[`../templates/${page.template}.html`];
  if (load) cache.set(page.template, await load());
}

export const pageTemplate = (pathname: string) => {
  const page = pages[pathname];
  return page ? cache.get(page.template) : undefined;
};

/* A tiny History API router: one external store that components subscribe to. */
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

addEventListener('popstate', async () => {
  try {
    await preloadPage(location.pathname);
  } catch {
    return location.reload(); // the chunk could not be fetched: let the browser load the page
  }
  emit();
});

export const usePathname = () => useSyncExternalStore(subscribe, () => normalisePath(location.pathname));
export const useSearch = () => useSyncExternalStore(subscribe, () => location.search);

/** Navigate to a same-origin URL once its template is ready. */
export async function push(url: string) {
  const target = new URL(url, location.href);
  try {
    await preloadPage(target.pathname);
  } catch {
    // The page's chunk could not be fetched (offline blip, or a new deploy replaced it):
    // fall back to an ordinary page load rather than leaving the visitor where they were.
    return location.assign(target.href);
  }
  history.pushState(null, '', target.pathname + target.search + target.hash);
  emit();
}

/** Update the query string in place (used by the puppy filters). */
export function replace(url: string) {
  history.replaceState(null, '', url);
  emit();
}
