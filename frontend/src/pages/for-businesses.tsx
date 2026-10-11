import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ImagePlus, PencilLine, Check } from 'lucide-react';
import '@/styles/merchant-workspace.css';

export default function ForBusinessesPage() {
  useEffect(() => {
    document.title = 'For grocery & clothing businesses | EthnoMart';
  }, []);
  return (
    <div className="em-merchant-page">
      <div className="em-merchant-demo-note">
        Catalogue pilot · Working local demonstration · Sample request and
        invitation workflow · Real enrolment is not open yet.
      </div>
      <div className="em-pilot-hero">
        <p className="em-merchant-eyebrow">For grocery & clothing businesses</p>
        <h1>
          Your business.
          <br />
          Your say.
        </h1>
        <p>
          A simple way to prepare a shop catalogue. Start with one product,
          check the details, and decide when it is ready for shoppers to see.
        </p>
        <div className="em-pilot-actions">
          <Link className="em-merchant-button" href="/pilot/apply">
            Try a shop request <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="em-merchant-text-link" href="/merchant">
            Explore the sample workspace
          </Link>
        </div>
      </div>
      <section
        className="em-pilot-cards"
        aria-label="How the catalogue workflow works"
      >
        <article>
          <ImagePlus size={28} strokeWidth={1.4} aria-hidden="true" />
          <h2>Start small.</h2>
          <p>
            Add a product photo or enter the details manually. Save an
            unfinished draft and return to it.
          </p>
        </article>
        <article>
          <PencilLine size={28} strokeWidth={1.4} aria-hidden="true" />
          <h2>Make it clear.</h2>
          <p>
            Enter the product name, pack or piece count, GBP price and reported
            availability. Clothing can also include known sizes and fabric.
            Leave availability unconfirmed when you do not know.
          </p>
        </article>
        <article>
          <Check size={28} strokeWidth={1.4} aria-hidden="true" />
          <h2>You approve.</h2>
          <p>
            Review the saved version before publishing. Editing returns it to
            draft; pausing hides it from the sample catalogue.
          </p>
        </article>
      </section>
      <section
        className="em-pilot-scope"
        aria-labelledby="em-pilot-scope-heading"
      >
        <h2 id="em-pilot-scope-heading">A useful first trial.</h2>
        <div>
          <p>
            The first goal is to test whether a shopkeeper can make and maintain
            a clear catalogue, and whether shoppers can find the products they
            need.
          </p>
          <p>
            This preview uses fictional shops and sample data. Catalogue changes
            are saved on this computer. Sample requests, invitations and manager
            review now work locally. Real email delivery, approved operator
            details and production storage are still needed before a live trial.
          </p>
          <p className="em-merchant-small">
            The demo supports catalogue browsing. Shop contact, purchasing and
            delivery are unavailable.
          </p>
          <Link className="em-merchant-text-link" href="/merchant">
            Explore the merchant workflow{' '}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="em-pilot-scope">
        <h2>Organisers and employers.</h2>
        <div>
          <p>
            Activities, opportunities and community notices have their own
            review queue. Try a fictional submission before real content
            onboarding.
          </p>
          <Link className="em-merchant-button" href="/contribute">
            Share a sample listing
          </Link>
        </div>
      </section>
    </div>
  );
}
