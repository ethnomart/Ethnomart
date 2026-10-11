import { Link } from 'wouter';
import { ArrowUpRight, Check } from 'lucide-react';
import '@/styles/reference-method-collage.css';

const base = import.meta.env.BASE_URL;
const widths = [480, 800, 1200] as const;
const photoSources = (format: string) =>
  widths
    .map(
      (width) =>
        `${base}images/method-product-photography-${width}.${format} ${width}w`,
    )
    .join(', ');

const steps = [
  { title: 'Photograph', copy: 'Start with a clear photo of the product.' },
  { title: 'Correct', copy: 'Check the name, pack size and price.' },
  { title: 'Approve', copy: 'Confirm availability, then approve publication.' },
] as const;

export function ReferenceMethodCollage() {
  return (
    <section
      id="how-it-works"
      tabIndex={-1}
      className="em-method"
      aria-labelledby="em-method-heading"
    >
      <div className="em-method-inner">
        <div className="em-method-content">
          <p className="em-method-label">
            <span aria-hidden="true" />
            Our method
          </p>
          <h2 id="em-method-heading">Every product starts with your say.</h2>
          <p className="em-method-copy">
            EthnoMart’s pilot is designed around a simple idea: the shopkeeper
            knows the product best. Start with a photo, correct the details,
            then approve what shoppers will see.
          </p>

          <div className="em-method-evidence">
            <figure className="em-method-preview">
              <Link
                href="/store/4"
                className="em-method-preview-link"
                aria-label="Explore the sample catalogue shown in this actual demo screenshot"
              >
                <img
                  src={`${base}images/method-catalogue-ui.webp`}
                  width={286}
                  height={444}
                  loading="lazy"
                  decoding="async"
                  alt="Actual sample catalogue card for Ponni Boiled Rice, showing pack size, sample price and sample availability."
                />
                <span>
                  Sample catalogue <ArrowUpRight size={17} aria-hidden="true" />
                </span>
              </Link>
              <figcaption>Actual demo UI</figcaption>
            </figure>

            <div className="em-method-workflow">
              <ol aria-label="Planned merchant workflow">
                {steps.map((step, index) => (
                  <li key={step.title}>
                    <span className="em-method-step-number" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="em-method-pilot-note">
                Planned workflow for the first merchant pilot.
              </p>
            </div>
          </div>
        </div>

        <figure className="em-method-photo">
          <picture>
            <source
              type="image/avif"
              srcSet={photoSources('avif')}
              sizes="(min-width: 960px) calc((100vw - 140px) / 2), (min-width: 700px) 680px, calc(100vw - 36px)"
            />
            <img
              src={`${base}images/method-product-photography-800.webp`}
              srcSet={photoSources('webp')}
              sizes="(min-width: 960px) calc((100vw - 140px) / 2), (min-width: 700px) 680px, calc(100vw - 36px)"
              width={1200}
              height={1499}
              loading="lazy"
              decoding="async"
              alt="Concept scene of a shopkeeper photographing a rice bag on a grocery counter."
            />
          </picture>
          <div className="em-method-photo-shade" aria-hidden="true" />
          <div className="em-method-photo-copy">
            <h3>From your shelf to your catalogue.</h3>
            <p>
              A clear photo is the starting point. Your review is the final
              step.
            </p>
          </div>
          <div className="em-method-owner-note">
            <span className="em-method-owner-icon" aria-hidden="true">
              <Check size={24} strokeWidth={1.5} />
            </span>
            <div>
              <p>Your shop. Your decision.</p>
              <span>Review the price and availability before publishing.</span>
            </div>
          </div>
          <figcaption>Concept image</figcaption>
        </figure>
      </div>
    </section>
  );
}
