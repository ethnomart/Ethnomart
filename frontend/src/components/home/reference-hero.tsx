import { Link } from 'wouter';
import { GlobalSearch } from './global-search';
import { ArrowDown, ArrowUpRight, ScanLine, Sprout, Store } from 'lucide-react';
import '@/styles/reference-hero.css';

const assetRoot = `${import.meta.env.BASE_URL}images/multicultural/`;

export function ReferenceHero() {
  return (
    <div className="em-reference-hero-frame">
      <section
        className="em-reference-hero"
        aria-labelledby="ethnomart-hero-heading"
      >
        <picture className="em-reference-hero-picture">
          <source
            type="image/avif"
            srcSet={`${assetRoot}neighbourhood-640.avif 640w, ${assetRoot}neighbourhood-960.avif 960w, ${assetRoot}neighbourhood-1536.avif 1536w`}
            sizes="(max-width: 960px) 960px, calc(100vw - 36px)"
          />
          <img
            src={`${assetRoot}neighbourhood-1536.webp`}
            srcSet={`${assetRoot}neighbourhood-640.webp 640w, ${assetRoot}neighbourhood-960.webp 960w, ${assetRoot}neighbourhood-1536.webp 1536w`}
            sizes="(max-width: 960px) 960px, calc(100vw - 36px)"
            width={1536}
            height={1024}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="em-reference-hero-shade" aria-hidden="true" />

        <div className="em-reference-hero-content">
          <h1 id="ethnomart-hero-heading" className="em-reference-hero-title">
            <span>Your culture.</span>
            <span>Your neighbourhood.</span>
          </h1>
          <p className="em-reference-hero-copy">
            Familiar shops. Clothes with a story. People and possibilities.
            Discover a little more of what feels like home.
          </p>
          <GlobalSearch />
        </div>

        <div className="em-reference-hero-bottom">
          <div className="em-reference-community-note">
            <div className="em-reference-community-icons" aria-hidden="true">
              <span>
                <Store size={22} strokeWidth={1.5} />
              </span>
              <span>
                <Sprout size={22} strokeWidth={1.5} />
              </span>
              <span>
                <ScanLine size={22} strokeWidth={1.5} />
              </span>
            </div>
            <div>
              <p className="em-reference-community-label">
                A shared place to start.
              </p>
              <p className="em-reference-community-sub">
                Local preview · AI concept photos.
              </p>
            </div>
          </div>

          <Link href="/for-businesses" className="em-reference-feature-card">
            <span className="em-reference-feature-icon" aria-hidden="true">
              <Store size={27} strokeWidth={1.5} />
            </span>
            <span className="em-reference-feature-copy">
              <span className="em-reference-feature-eyebrow">
                FOR LOCAL BUSINESSES
              </span>
              <span className="em-reference-feature-title">
                Your shop. A wider community.
              </span>
            </span>
            <ArrowUpRight
              className="em-reference-feature-arrow"
              size={21}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </Link>
        </div>

        <a
          href="#communities"
          className="em-reference-scroll"
          aria-label="Scroll to communities"
        >
          <ArrowDown size={17} strokeWidth={1.6} aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
