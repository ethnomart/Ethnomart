import { ResponsivePhoto as ConceptPhoto } from '@/components/responsive-photo';
import { CataloguePhoto } from '@/components/catalogue-photo';
import { useReveal } from '@/lib/use-reveal';
import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, Bookmark, MapPin } from 'lucide-react';
import {
  itemKey,
  londonTime,
  usePreferences,
  type PlatformItem,
} from '@/lib/platform-api';
import '@/styles/multicultural.css';
export { ResponsivePhoto as ConceptPhoto } from '@/components/responsive-photo';
export function PreviewNote() {
  return (
    <p className="em-m-preview">
      {import.meta.env.DEV ? 'Local preview' : 'Website preview'} · Sample
      listings · AI concept photos
    </p>
  );
}
export function SaveButton({ item }: { item: PlatformItem }) {
  const saved = usePreferences(),
    [error, setError] = useState(''),
    id = itemKey(item),
    on = saved.ids.includes(id);
  return (
    <>
      <button
        className="em-m-save"
        aria-pressed={on}
        aria-label={`${on ? 'Remove' : 'Save'} ${item.title}`}
        onClick={() => {
          setError(
            saved.toggle(id)
              ? ''
              : 'This browser could not save your preference.',
          );
        }}
      >
        <Bookmark
          size={18}
          fill={on ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        <span>{on ? 'Saved' : 'Save'}</span>
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function ItemCard({ item }: { item: PlatformItem }) {
  return (
    <article data-em-reveal className={`em-m-card em-m-card--${item.kind}`}>
      <Link
        href={item.href}
        className="em-m-card-photo"
        aria-label={`Explore ${item.title}`}
      >
        {item.imageUrl ? (
          <CataloguePhoto url={item.imageUrl} />
        ) : (
          <ConceptPhoto name={item.image} />
        )}
        <span className="em-m-tag">
          {item.kind === 'shop'
            ? item.businessKind === 'clothing'
              ? 'Clothing shop'
              : 'Grocery shop'
            : item.kind === 'job'
              ? 'Opportunity'
              : item.kind === 'notice'
                ? 'Notice'
                : item.kind}
        </span>
      </Link>
      <div className="em-m-card-body">
        <div className="em-m-card-meta">
          {item.cityName && (
            <span>
              <MapPin size={13} aria-hidden="true" />
              {item.cityName}
            </span>
          )}
          <span>{item.communityName || 'Open to everyone'}</span>
        </div>
        <h3>
          <Link href={item.href}>
            {item.title}
            <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </h3>
        <p>{item.summary}</p>
        {item.startsAt && (
          <p className="em-m-small">{londonTime(item.startsAt)} · UK time</p>
        )}
        {item.employmentType && (
          <p className="em-m-small">
            {item.employmentType} ·{' '}
            {item.closesAt && Date.parse(item.closesAt) < Date.now()
              ? 'Closed sample role'
              : 'Sample vacancy'}
          </p>
        )}
        {item.pricePence !== undefined && (
          <strong className="em-m-price">
            £{(item.pricePence / 100).toFixed(2)} <small>sample price</small>
          </strong>
        )}
        <div className="em-m-card-bottom">
          <Link href={item.href}>
            Explore <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          {item.kind !== 'notice' && <SaveButton item={item} />}
        </div>
      </div>
    </article>
  );
}
export function ItemGrid({ items }: { items: PlatformItem[] }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="em-m-grid">
      {items.map((item) => (
        <ItemCard key={itemKey(item)} item={item} />
      ))}
    </div>
  );
}
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: Error | null;
  retry: () => void;
}) {
  if (loading)
    return (
      <p className="em-m-state" role="status">
        Finding your next discovery…
      </p>
    );
  if (error)
    return (
      <div className="em-m-state" role="alert">
        <h2>This view could not load.</h2>
        <p>{error.message}</p>
        <button className="em-m-button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  return null;
}
export function SectionHeading({
  eyebrow,
  title,
  copy,
  href,
  label = 'Explore all',
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="em-m-section-heading">
      <div>
        <p className="em-m-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {href && (
        <Link className="em-m-link" href={href}>
          {label}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
