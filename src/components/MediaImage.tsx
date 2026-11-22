import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Media } from '../types';

interface MediaImageProps {
  media: Media;
  alt?: string;
  className?: string;
  eager?: boolean;
  /** `fill` covers the parent box; `natural` keeps the photo's own aspect ratio. */
  layout?: 'fill' | 'natural';
  style?: CSSProperties;
  onLoad?: (image: HTMLImageElement) => void;
}

const focal = (media: Media) => `${(media.focalX * 100).toFixed(1)}% ${(media.focalY * 100).toFixed(1)}%`;

/**
 * A photo with a blurred placeholder behind it until the real file has decoded.
 * Mirrors the markup of the reference's image component (focal-point cropping,
 * dominant colour, tiny blur preview), minus its server-side resizing.
 */
export function MediaImage({ media, alt, className, eager, layout = 'fill', style, onLoad }: MediaImageProps) {
  const [loaded, setLoaded] = useState(false);
  const placeholder: CSSProperties =
    !loaded && media.blurDataUrl
      ? {
          backgroundSize: 'cover',
          backgroundPosition: layout === 'fill' ? focal(media) : '50% 50%',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `url("${media.blurDataUrl}")`,
        }
      : {};
  const box: CSSProperties =
    layout === 'fill'
      ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
          objectFit: 'cover',
          objectPosition: focal(media),
        }
      : { width: '100%', height: 'auto' };
  return (
    <img
      alt={alt ?? media.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      data-nimg={layout === 'fill' ? 'fill' : '1'}
      className={className}
      width={layout === 'natural' ? media.width : undefined}
      height={layout === 'natural' ? media.height : undefined}
      style={{ ...box, color: 'transparent', backgroundColor: media.color, ...placeholder, ...style }}
      src={media.url}
      ref={(image) => {
        // Cached images can finish before React attaches onLoad.
        if (image?.complete && image.naturalWidth && !loaded) setLoaded(true);
      }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event.currentTarget);
      }}
    />
  );
}
