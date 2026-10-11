import { Link } from 'wouter';
import '@/styles/catalogue.css';
export default function CatalogueScopePage() {
  return (
    <div className="em-catalogue em-catalogue-message">
      <p className="em-catalogue-eyebrow">Local preview</p>
      <h1>Start with a discovery.</h1>
      <p>
        This local preview supports shops, clothing, communities, events, jobs
        and reviewed sample contributions. Public registration, purchasing,
        payments and delivery are not available.
      </p>
      <Link className="em-catalogue-button" href="/explore">
        Explore EthnoMart
      </Link>
      <Link className="em-catalogue-back" href="/merchant">
        Shopkeeper workspace
      </Link>
    </div>
  );
}
