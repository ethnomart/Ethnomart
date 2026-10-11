import { useEffect, useRef, type PointerEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import '@/styles/reference-intro.css';

const assetRoot = `${import.meta.env.BASE_URL}images/individual/`;
const pointerMotionQuery =
  '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

function InlineGroceryImage({ subject }: { subject: 'produce' | 'spices' }) {
  return (
    <span
      className={`em-intro-image em-intro-image--${subject}`}
      aria-hidden="true"
    >
      <picture>
        <source
          type="image/avif"
          srcSet={`${assetRoot}${subject === 'produce' ? 'intro-textiles' : 'intro-connection'}-640.avif 640w, ${assetRoot}${subject === 'produce' ? 'intro-textiles' : 'intro-connection'}-960.avif 960w`}
          sizes="(max-width: 569px) 78px, 150px"
        />
        <img
          src={`${assetRoot}${subject === 'produce' ? 'intro-textiles' : 'intro-connection'}-960.webp`}
          srcSet={`${assetRoot}${subject === 'produce' ? 'intro-textiles' : 'intro-connection'}-640.webp 640w, ${assetRoot}${subject === 'produce' ? 'intro-textiles' : 'intro-connection'}-960.webp 960w`}
          sizes="(max-width: 569px) 78px, 150px"
          width={320}
          height={213}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>
    </span>
  );
}

export function ReferenceIntro() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pointerMedia = useRef<MediaQueryList | null>(null);
  const frame = useRef(0);
  const latestPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    pointerMedia.current = window.matchMedia(pointerMotionQuery);
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      pointerMedia.current = null;
    };
  }, []);

  function followPointer(event: PointerEvent<HTMLHeadingElement>) {
    if (!pointerMedia.current?.matches || event.pointerType !== 'mouse') return;
    latestPointer.current = { x: event.clientX, y: event.clientY };
    if (frame.current) return;

    // Batch pointer movement into one small transform update per frame.
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const heading = headingRef.current;
      if (!heading) return;
      const bounds = heading.getBoundingClientRect();
      const x = Math.max(
        -1,
        Math.min(
          1,
          ((latestPointer.current.x - bounds.left) / bounds.width - 0.5) * 2,
        ),
      );
      const y = Math.max(
        -1,
        Math.min(
          1,
          ((latestPointer.current.y - bounds.top) / bounds.height - 0.5) * 2,
        ),
      );
      const horizontalTravel = Math.min(10, bounds.width / 80);
      const verticalTravel = Math.min(6, bounds.height / 40);
      heading.style.setProperty(
        '--intro-pointer-x',
        `${(x * horizontalTravel).toFixed(2)}px`,
      );
      heading.style.setProperty(
        '--intro-pointer-y',
        `${(y * verticalTravel).toFixed(2)}px`,
      );
      heading.style.setProperty(
        '--intro-pointer-tilt',
        `${(x * 4).toFixed(2)}deg`,
      );
    });
  }

  function resetPointer() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const heading = headingRef.current;
    heading?.style.removeProperty('--intro-pointer-x');
    heading?.style.removeProperty('--intro-pointer-y');
    heading?.style.removeProperty('--intro-pointer-tilt');
  }

  return (
    <section
      id="local-favourites"
      className="em-reference-intro"
      aria-labelledby="local-favourites-heading"
    >
      <div className="em-reference-intro-inner">
        <h2
          ref={headingRef}
          id="local-favourites-heading"
          aria-label="Your local favourites, easier to find."
          className="em-reference-intro-title"
          onPointerMove={followPointer}
          onPointerLeave={resetPointer}
          onPointerCancel={resetPointer}
        >
          <span className="em-intro-line">
            <span className="em-intro-phrase">Your local</span>{' '}
            <InlineGroceryImage subject="produce" />{' '}
            <span className="em-intro-phrase">favourites,</span>
          </span>{' '}
          <span className="em-intro-line">
            <InlineGroceryImage subject="spices" />{' '}
            <span className="em-intro-phrase">easier to find.</span>
          </span>
        </h2>
        <p className="em-reference-intro-copy">
          From a familiar flavour to a garment, a gathering or a new
          possibility. Find useful connections across our multicultural
          neighbourhoods.
        </p>
        <a className="em-reference-intro-link" href="#communities">
          Browse communities
          <span aria-hidden="true">
            <ArrowUpRight size={20} strokeWidth={1.6} />
          </span>
        </a>
      </div>
    </section>
  );
}
