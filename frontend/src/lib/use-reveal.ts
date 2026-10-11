import { useEffect, useRef } from 'react';

// Animate content already visible by default; never hide it pending JS/observation.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !window.IntersectionObserver || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          if (!media.matches) target.classList.add('em-entered');
          observer.unobserve(target);
        });
      },
      { threshold: 0.08 },
    );
    const scan = () => {
      if (media.matches) return;
      root
        .querySelectorAll<HTMLElement>('[data-em-reveal]')
        .forEach((element, index) => {
          if (seen.has(element)) return;
          seen.add(element);
          element.style.setProperty(
            '--em-reveal-delay',
            `${(index % 3) * 45}ms`,
          );
          observer.observe(element);
        });
    };
    const change = () => {
      if (media.matches) {
        observer.disconnect();
        root
          .querySelectorAll('.em-entered')
          .forEach((el) => el.classList.remove('em-entered'));
      }
      // A preference change never replays already seen elements.
      else scan();
    };
    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(root, { childList: true, subtree: true });
    media.addEventListener('change', change);
    return () => {
      observer.disconnect();
      mutation.disconnect();
      media.removeEventListener('change', change);
    };
  }, []);
  return ref;
}
