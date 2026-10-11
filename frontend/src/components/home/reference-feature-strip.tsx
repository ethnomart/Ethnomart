import { useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import '@/styles/reference-feature-strip.css';

const features = [
  {
    id: 'discover',
    label: 'A taste of home',
    title: 'Find the local shops that feel like home.',
    copy: 'From Pakistani and Indian groceries to African and Middle Eastern favourites, explore our sample shops by community and discover the ingredients you grew up with.',
    cta: 'Explore sample shops',
    href: '#communities',
    image: 'neighbourhood-shop',
    alt: 'Fresh aubergines, chillies and coriander outside a neighbourhood grocery.',
    colour: 'peach',
  },
  {
    id: 'ingredients',
    label: 'Everyday favourites',
    title: 'Your familiar ingredients, all in one place.',
    copy: 'See how an EthnoMart shop catalogue brings spices, pantry staples and everyday essentials together. Explore our sample shop to see how it works.',
    cta: 'View sample catalogue',
    href: '/store/4',
    image: 'familiar-ingredients',
    alt: 'Bowls of dried chillies, coriander, turmeric, cumin and star anise on a wooden counter.',
    colour: 'sky',
  },
  {
    id: 'businesses',
    label: 'For neighbourhood businesses',
    title: 'Make your local shop easier to discover.',
    copy: 'Our planned merchant pilot will help you introduce your shop and review its product catalogue. Start small, with the details you approve.',
    cta: 'Explore the merchant pilot',
    href: '/for-businesses',
    image: 'shop-counter',
    alt: 'A shopkeeper packing a paper grocery bag behind a counter with a tablet.',
    colour: 'lilac',
  },
] as const;

const widths = [480, 800, 1200] as const;
const base = import.meta.env.BASE_URL;
const sourceSet = (name: string, format: string) =>
  widths
    .map(
      (width) => `${base}images/feature-${name}-${width}.${format} ${width}w`,
    )
    .join(', ');

export function ReferenceFeatureStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef<
    ((index: number, animate: boolean) => void) | null
  >(null);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    const query = window.matchMedia(
      '(min-width: 960px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)',
    );
    let frame = 0;
    let travel = 0;
    let stops: number[] = [];
    let lastActive = -1;
    const clamp = (value: number, max: number) =>
      Math.min(max, Math.max(0, value));

    const update = () => {
      frame = 0;
      if (!query.matches || travel <= 0) return;
      const distance = clamp(-section.getBoundingClientRect().top, travel);
      track.style.transform = `translate3d(${-distance}px, 0, 0)`;
      const current = stops.reduce(
        (closest, stop, index) =>
          Math.abs(stop - distance) < Math.abs(stops[closest] - distance)
            ? index
            : closest,
        0,
      );
      if (current !== lastActive) {
        lastActive = current;
        setActive(current);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const reset = () => {
      delete section.dataset.pinned;
      section.style.removeProperty('height');
      track.style.removeProperty('transform');
      navigateRef.current = null;
      travel = 0;
      lastActive = -1;
    };
    const measure = () => {
      if (!query.matches) {
        reset();
        return;
      }
      section.dataset.pinned = 'true';
      travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
      const panels = Array.from(
        track.querySelectorAll<HTMLElement>('[data-feature-index]'),
      );
      const gutter = panels[0]?.offsetLeft || 0;
      stops = panels.map((panel) => clamp(panel.offsetLeft - gutter, travel));
      section.style.height = `${window.innerHeight + travel}px`;
      navigateRef.current = (index, animate) => {
        const top =
          window.scrollY +
          section.getBoundingClientRect().top +
          stops[clamp(index, stops.length - 1)];
        window.scrollTo({ top, behavior: animate ? 'smooth' : 'instant' });
      };
      schedule();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', schedule, { passive: true });
    query.addEventListener('change', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', schedule);
      query.removeEventListener('change', measure);
      window.cancelAnimationFrame(frame);
      reset();
    };
  }, []);

  const revealFocusedPanel = (event: FocusEvent<HTMLDivElement>) => {
    const panel = event.target.closest<HTMLElement>('[data-feature-index]');
    if (panel) navigateRef.current?.(Number(panel.dataset.featureIndex), false);
  };

  return (
    <section
      ref={sectionRef}
      id="explore-ethnomart"
      className="em-feature-strip"
      aria-labelledby="em-features-heading"
    >
      <h2 id="em-features-heading" className="sr-only">
        Discover your neighbourhood with EthnoMart
      </h2>
      <div className="em-feature-stage">
        <div ref={viewportRef} className="em-feature-viewport">
          <div
            ref={trackRef}
            id="em-feature-panels"
            className="em-feature-track"
            onFocusCapture={revealFocusedPanel}
          >
            {features.map((feature, index) => (
              <article
                key={feature.id}
                data-feature-index={index}
                className={`em-feature-panel em-feature-panel--${feature.colour}`}
                aria-labelledby={`em-feature-${feature.id}`}
              >
                <div className="em-feature-photo">
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={sourceSet(feature.image, 'avif')}
                      sizes="(min-width: 960px) 45vw, 100vw"
                    />
                    <img
                      src={`${base}images/feature-${feature.image}-800.webp`}
                      srcSet={sourceSet(feature.image, 'webp')}
                      sizes="(min-width: 960px) 45vw, 100vw"
                      width={1200}
                      height={1500}
                      loading="lazy"
                      decoding="async"
                      alt={feature.alt}
                    />
                  </picture>
                </div>
                <div className="em-feature-content">
                  <div>
                    <p className="em-feature-label">
                      <span aria-hidden="true" />
                      {feature.label}
                    </p>
                    <h3 id={`em-feature-${feature.id}`}>{feature.title}</h3>
                    <p className="em-feature-copy">{feature.copy}</p>
                  </div>
                  {feature.href.startsWith('#') ? (
                    <a href={feature.href} className="em-feature-link">
                      {feature.cta}
                      <span aria-hidden="true">
                        <ArrowUpRight size={20} strokeWidth={1.7} />
                      </span>
                    </a>
                  ) : (
                    <Link href={feature.href} className="em-feature-link">
                      {feature.cta}
                      <span aria-hidden="true">
                        <ArrowUpRight size={20} strokeWidth={1.7} />
                      </span>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div
          className="em-feature-controls"
          role="group"
          aria-label="Feature navigation"
          aria-controls="em-feature-panels"
        >
          <p className="em-feature-scroll-hint">
            Scroll to explore <ArrowRight size={15} aria-hidden="true" />
          </p>
          <div className="em-feature-dots">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                type="button"
                aria-label={`Show feature ${index + 1}: ${feature.label}`}
                aria-pressed={active === index}
                onClick={() => navigateRef.current?.(index, true)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="em-feature-arrows">
            <button
              type="button"
              aria-label="Previous feature"
              disabled={active === 0}
              onClick={() => navigateRef.current?.(active - 1, true)}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next feature"
              disabled={active === features.length - 1}
              onClick={() => navigateRef.current?.(active + 1, true)}
            >
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
