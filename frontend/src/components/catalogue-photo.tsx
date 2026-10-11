import { photoKeyFromUrl } from '@/lib/photo-assets';
import { ResponsivePhoto } from '@/components/responsive-photo';
import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { catalogueImage } from '@/lib/catalogue-api';

export function CataloguePhoto({
  url,
  alt = '',
  eager = false,
  sizes,
}: {
  url?: string;
  alt?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed)
    return (
      <div className="em-catalogue-photo-placeholder">
        <Package size={48} aria-hidden="true" />
        <span>No photo available</span>
      </div>
    );
  const photoKey = photoKeyFromUrl(url);
  if (photoKey)
    return (
      <ResponsivePhoto name={photoKey} alt={alt} eager={eager} sizes={sizes} />
    );
  return (
    <img
      src={catalogueImage(url)}
      alt={alt}
      width={640}
      height={640}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
