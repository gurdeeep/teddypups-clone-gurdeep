/**
 * Responsive images.
 *
 * The reference runs on Next.js, whose image optimizer resizes every photo to
 * the size it is displayed at. A static build has no such server, so when the
 * site is deployed on Netlify (VITE_IMAGE_CDN=netlify, set in netlify.toml) we
 * ask Netlify's Image CDN for the same thing: a `srcset` of resized versions,
 * with the browser choosing one from the `sizes` hint.
 *
 * Anywhere else (local dev, `vite preview`) the original files are used as-is.
 */
const ENABLED = import.meta.env.VITE_IMAGE_CDN === 'netlify';

/** The width steps Next.js uses, so we request the same variants the reference does. */
const WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];

const resized = (src: string, width: number, quality: number) =>
  `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

const atLeast = (width: number) => WIDTHS.find((step) => step >= width) ?? WIDTHS[WIDTHS.length - 1];

interface Options {
  /** CSS `sizes` hint: how wide the image is displayed at each breakpoint. */
  sizes?: string;
  /** Fixed display width in CSS pixels, for images that never change size (logos). */
  width?: number;
  quality?: number;
}

/** Image attributes for a local file: just `src`, or `src` + `srcSet` when the CDN is on. */
export function responsive(src: string, { sizes, width, quality = 75 }: Options = {}) {
  // AVIF files are already small; SVGs are vectors. Neither is worth a round trip.
  if (!ENABLED || !src.startsWith('/') || /\.(svg|avif)$/i.test(src)) return { src, sizes };
  if (width && !sizes) {
    const once = atLeast(width);
    const twice = atLeast(width * 2);
    return {
      src: resized(src, twice, quality),
      srcSet: `${resized(src, once, quality)} 1x, ${resized(src, twice, quality)} 2x`,
    };
  }
  return {
    src: resized(src, 828, quality),
    srcSet: WIDTHS.filter((step) => step >= 64)
      .map((step) => `${resized(src, step, quality)} ${step}w`)
      .join(', '),
    sizes: sizes ?? '100vw',
  };
}
