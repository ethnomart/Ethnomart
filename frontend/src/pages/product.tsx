import { useEffect } from 'react';
import { Link, useRoute, useSearch } from 'wouter';
import { ArrowLeft, ArrowUpRight, Clock3 } from 'lucide-react';
import {
  CatalogueError,
  catalogueUrl,
  confirmationAge,
  useCatalogueProduct,
} from '@/lib/catalogue-api';
import {
  availabilityLabels,
  formatGBP,
  formatConfirmation,
} from '@/lib/merchant-listings';
import '@/styles/catalogue.css';
import { CataloguePhoto } from '@/components/catalogue-photo';

export default function ProductPage() {
  const [, params] = useRoute('/store/:storeId/product/:productId');
  const storeId = Number(params?.storeId),
    id = Number(params?.productId);
  const filters = new URLSearchParams(useSearch());
  const result = useCatalogueProduct(storeId, id);
  const product = result.data?.product,
    shop = result.data?.shop;
  const back = catalogueUrl(
    storeId,
    filters.get('q') || '',
    filters.get('category') || '',
    Number(filters.get('page')) || 1,
  );
  useEffect(() => {
    document.title = `${product?.name || 'Product'} | EthnoMart`;
  }, [product?.name]);
  if (result.isLoading)
    return (
      <div className="em-catalogue em-catalogue-message" role="status">
        Loading product…
      </div>
    );
  if (!product || !shop)
    return (
      <div className="em-catalogue em-catalogue-message">
        <p className="em-catalogue-eyebrow">Sample catalogue</p>
        <h1>
          {result.error instanceof CatalogueError && result.error.status === 404
            ? 'This product is unavailable.'
            : 'The product couldn’t load.'}
        </h1>
        <p>
          {result.error?.message || 'Check the product address and try again.'}
        </p>
        <Link
          className="em-catalogue-button"
          href={Number.isSafeInteger(storeId) && storeId > 0 ? back : '/shops'}
        >
          Back to catalogue
        </Link>
        {result.error &&
          !(
            result.error instanceof CatalogueError &&
            result.error.status === 404
          ) && (
            <button
              className="em-catalogue-back"
              onClick={() => {
                void result.refetch();
              }}
            >
              Try again
            </button>
          )}
      </div>
    );
  return (
    <div className="em-catalogue em-product-page">
      <Link className="em-catalogue-back" href={back}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to {shop.name}
      </Link>
      <p className="em-catalogue-eyebrow">A closer look · Sample catalogue</p>
      <div className="em-product-layout">
        <div className="em-product-photo">
          <CataloguePhoto
            url={product.imageUrl}
            alt={product.name}
            eager
            sizes="(max-width: 850px) 100vw, 50vw"
          />
        </div>
        <section
          className="em-product-information"
          aria-labelledby="product-name"
        >
          <p className="em-product-category">{product.category}</p>
          {product.brand && <p className="em-product-brand">{product.brand}</p>}
          <h1 id="product-name">{product.name}</h1>
          <p className="em-product-pack">
            {product.unit || 'Pack size not specified'}
          </p>
          {shop.kind === 'clothing' && (
            <dl className="em-m-facts">
              <div>
                <dt>Sizes (sample)</dt>
                <dd>{product.sizes || 'Not supplied'}</dd>
              </div>
              <div>
                <dt>Fabric (sample)</dt>
                <dd>{product.fabric || 'Not supplied'}</dd>
              </div>
            </dl>
          )}
          <p className="em-product-price">
            {formatGBP(product.pricePence)} <span>sample price</span>
          </p>
          <p
            className={`em-product-availability ${product.availabilityStatus === 'in_stock' ? 'is-available' : ''}`}
          >
            {availabilityLabels[product.availabilityStatus]} · sample status
          </p>
          <div className="em-product-review">
            <Clock3 size={19} aria-hidden="true" />
            <div>
              <h2>{confirmationAge(product.confirmedAt)}</h2>
              <p>
                {product.confirmedAt
                  ? `Price and reported availability reviewed ${formatConfirmation(product.confirmedAt)} (UK time).`
                  : 'This starter product has no recorded shopkeeper confirmation.'}
              </p>
              <p>
                Reported availability can change. It does not guarantee current
                stock.
              </p>
            </div>
          </div>
          {product.aliases.length > 0 && (
            <div className="em-product-aliases">
              <h2>Also known as</h2>
              <ul>
                {product.aliases.map((alias, index) => (
                  <li dir="auto" key={`${index}:${alias}`}>
                    {alias}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="em-product-shop">
            <p>From {shop.name}</p>
            <span>
              {shop.cityName} · {shop.communityName}
            </span>
            <Link href={back}>
              Explore this catalogue{' '}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
      <div className="em-catalogue-notice">
        <h2>A useful preview. Sample details.</h2>
        <p>
          This fictional catalogue demonstrates product discovery. Shop contact
          and purchasing are unavailable. Product images are illustrative,
          including AI concept photos. No product specifications, ingredients or
          certification have been independently verified.
        </p>
      </div>
    </div>
  );
}
