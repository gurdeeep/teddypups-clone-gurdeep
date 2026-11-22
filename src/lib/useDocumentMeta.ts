import { useEffect } from 'react';
import type { PageMeta } from './router';
import { REFERENCE_ORIGIN } from './site';

const DEFAULT_TITLE = 'TeddyPups U.A.E. — Premium teacup puppies in Dubai';

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content?: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) return tag?.remove();
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.append(tag);
  }
  tag.content = content;
}

/**
 * Keeps <head> in step with the current route: title, description, canonical
 * URL, social-card tags and structured data. A single-page app has one HTML
 * file, so these have to be rewritten on every navigation.
 */
export function useDocumentMeta(pathname: string, page?: PageMeta) {
  useEffect(() => {
    const url = location.origin + (pathname === '/' ? '' : pathname);
    const title = page?.title ?? DEFAULT_TITLE;
    const social = page?.ogTitle ?? title;
    const image = page?.ogImage ? location.origin + page.ogImage : undefined;

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', page?.description);
    setMeta('meta[name="robots"]', 'name', 'robots', page ? undefined : 'noindex');
    setMeta('meta[property="og:title"]', 'property', 'og:title', social);
    setMeta('meta[property="og:description"]', 'property', 'og:description', page?.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', page?.ogImageAlt);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', social);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', page?.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = url;

    document.getElementById('structured-data')?.remove();
    if (page?.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'structured-data';
      // The saved data points at the reference's domain; point it at wherever this build is hosted.
      script.textContent = JSON.stringify(page.jsonLd).replaceAll(REFERENCE_ORIGIN, location.origin);
      document.head.append(script);
    }
  }, [pathname, page]);
}
