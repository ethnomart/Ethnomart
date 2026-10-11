import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { photoSource } from '@/lib/photo-assets';

export function PhotoPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`em-photo-placeholder ${className}`}>
      <ImageOff size={30} aria-hidden="true" />
      <span>No photo available</span>
    </div>
  );
}

export function ResponsivePhoto({
  name,
  alt = '',
  eager = false,
  className = '',
  sizes = '(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw',
}: {
  name: string;
  alt?: string;
  eager?: boolean;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [name]);
  const source = photoSource(name);
  if (!source || failed) return <PhotoPlaceholder className={className} />;
  const root = import.meta.env.BASE_URL + source.root + source.name;
  return (
    <picture className={className} data-photo-key={name}>
      <source
        type="image/avif"
        srcSet={`${root}-640.avif 640w, ${root}-960.avif 960w, ${root}-1536.avif 1536w`}
        sizes={sizes}
      />
      <img
        src={`${root}-960.webp`}
        srcSet={`${root}-640.webp 640w, ${root}-960.webp 960w, ${root}-1536.webp 1536w`}
        sizes={sizes}
        width={1536}
        height={1024}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
