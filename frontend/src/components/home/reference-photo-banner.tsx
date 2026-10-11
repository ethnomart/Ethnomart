import { useEffect, useRef, type PointerEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import '@/styles/reference-photo-banner.css';

const base = import.meta.env.BASE_URL;
const pointerQuery =
  '(min-width: 960px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

const subjects = {
  grocer: { name: 'banner-grocer', height: 213 },
  produce: { name: 'intro-produce', height: 213 },
  spices: { name: 'intro-spices', height: 213 },
  neighbourhood: { name: 'banner-neighbourhood-shop', height: 400 },
  ingredients: { name: 'banner-familiar-ingredients', height: 400 },
  counter: { name: 'banner-shop-counter', height: 400 },
  photograph: { name: 'banner-product-photography', height: 400 },
} as const;

// Reuse seven approved concept photos; repeated tiles share the same cached image.
const tiles: (keyof typeof subjects)[] = [
  'grocer',
  'produce',
  'counter',
  'spices',
  'ingredients',
  'photograph',
  'produce',
  'counter',
  'grocer',
  'neighbourhood',
  'produce',
  'ingredients',
  'spices',
  'neighbourhood',
  'photograph',
  'grocer',
];

function PhotoTile({
  subject,
  index,
}: {
  subject: keyof typeof subjects;
  index: number;
}) {
  const photo = subjects[subject];
  const sources = (format: string) =>
    [160, 320]
      .map(
        (width) => `${base}images/${photo.name}-${width}.${format} ${width}w`,
      )
      .join(', ');
  return (
    <picture className={`em-banner-tile em-banner-tile--${index + 1}`}>
      <source
        type="image/avif"
        srcSet={sources('avif')}
        sizes="(max-width: 569px) 86px, (max-width: 959px) 110px, 127px"
      />
      <img
        src={`${base}images/${photo.name}-320.webp`}
        srcSet={sources('webp')}
        sizes="(max-width: 569px) 86px, (max-width: 959px) 110px, 127px"
        width={320}
        height={photo.height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

export function ReferencePhotoBanner() {
  const bannerRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<MediaQueryList | null>(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  const resetPointer = () => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    bannerRef.current?.style.removeProperty('--em-banner-x');
    bannerRef.current?.style.removeProperty('--em-banner-y');
  };

  useEffect(() => {
    const media = window.matchMedia(pointerQuery);
    mediaRef.current = media;
    const reset = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      bannerRef.current?.style.removeProperty('--em-banner-x');
      bannerRef.current?.style.removeProperty('--em-banner-y');
    };
    media.addEventListener('change', reset);
    return () => {
      media.removeEventListener('change', reset);
      reset();
      mediaRef.current = null;
    };
  }, []);

  const followPointer = (event: PointerEvent<HTMLElement>) => {
    if (!mediaRef.current?.matches || event.pointerType !== 'mouse') return;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const banner = bannerRef.current;
      if (!banner || !mediaRef.current?.matches) return;
      const box = banner.getBoundingClientRect();
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      const x = clamp(
        ((pointerRef.current.x - box.left) / box.width - 0.5) * 2,
      );
      const y = clamp(
        ((pointerRef.current.y - box.top) / box.height - 0.5) * 2,
      );
      banner.style.setProperty('--em-banner-x', `${(x * 20).toFixed(2)}px`);
      banner.style.setProperty('--em-banner-y', `${(y * 16).toFixed(2)}px`);
    });
  };

  return (
    <div className="em-photo-banner-frame">
      <section
        ref={bannerRef}
        id="closer-to-home"
        tabIndex={-1}
        className="em-photo-banner"
        aria-labelledby="em-photo-banner-heading"
        onPointerMove={followPointer}
        onPointerLeave={resetPointer}
        onPointerCancel={resetPointer}
      >
        <div className="em-photo-banner-tiles" aria-hidden="true">
          {tiles.map((subject, index) => (
            <PhotoTile key={index} subject={subject} index={index} />
          ))}
        </div>
        <div className="em-photo-banner-content">
          <h2 id="em-photo-banner-heading">
            Closer to your
            <br className="em-photo-banner-heading-break" /> local favourites.
          </h2>
          <a className="em-photo-banner-link" href="#communities">
            Explore sample shops
            <span aria-hidden="true">
              <ArrowUpRight size={19} strokeWidth={1.7} />
            </span>
          </a>
          <p className="em-photo-banner-note">
            Catalogue demo · Concept imagery
          </p>
        </div>
      </section>
    </div>
  );
}
