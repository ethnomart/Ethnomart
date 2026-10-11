import { useEffect } from 'react';
import { ShopDirectory } from '@/components/shops/shop-directory';

export default function ShopsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Sample shop directory | EthnoMart';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="em-shops-page">
      <section className="em-shops-intro" aria-labelledby="em-shops-heading">
        <p className="em-shops-eyebrow">
          <span aria-hidden="true" />
          Catalogue preview
        </p>
        <h1 id="em-shops-heading">
          Find your familiar
          <br />
          favourites.
        </h1>
        <div className="em-shops-intro-bottom">
          <p>
            Choose a shop, explore its catalogue and find the ingredients you
            know.
          </p>
          <p className="em-shops-demo-note">
            This directory uses fictional sample shops. Live shop contact and
            purchasing are unavailable in this preview.
          </p>
        </div>
      </section>
      <section
        className="em-shops-content"
        aria-labelledby="em-directory-heading"
      >
        <h2 id="em-directory-heading" className="em-shops-section-heading">
          Browse sample shops
        </h2>
        <ShopDirectory />
      </section>
      <section
        className="em-shops-next"
        aria-labelledby="em-shops-next-heading"
      >
        <h2 id="em-shops-next-heading">How the pilot will work</h2>
        <ol>
          <li>
            <span>01</span>
            <h3>Choose a participating shop</h3>
            <p>Find its location and shop-supplied catalogue.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Search its shelves</h3>
            <p>Read the pack size, price and reported availability.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Contact the shop</h3>
            <p>
              Ask the seller about availability and pickup. The shop handles the
              sale.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
