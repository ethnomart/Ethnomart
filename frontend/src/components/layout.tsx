import { type ReactNode, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ReferenceHeader } from '@/components/home/reference-header';
import { pageTrail } from '@/lib/site-navigation';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  useGetMe,
  useLogout,
  getGetMeQueryKey,
} from '@workspace/api-client-react';
import '@/styles/multicultural.css';
export function Layout({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuthStore(),
    me = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } }),
    logout = useLogout(),
    client = useQueryClient(),
    [location, navigate] = useLocation(),
    previous = useRef(location),
    main = useRef<HTMLElement>(null);
  useEffect(() => {
    if (me.isSuccess && me.data) setUser(me.data);
    else if (me.isError) setUser(null);
  }, [me.isSuccess, me.isError, me.data, setUser]);
  useEffect(() => {
    if (previous.current === location) return;
    previous.current = location;
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    const frame = requestAnimationFrame(() =>
      main.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [location]);
  const account = !user
    ? '/login'
    : user.role === 'admin'
      ? '/admin/merchant-pilot'
      : user.role === 'store_owner'
        ? '/merchant'
        : '/saved';
  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        for (const key of ['merchant', 'manager', 'platform-manager'])
          client.removeQueries({ queryKey: [key] });
        client.setQueryData(getGetMeQueryKey(), null);
        setUser(null);
        navigate('/');
      },
    });
  const groups = [
    {
      title: 'Discover',
      links: [
        ['Explore all', '/explore'],
        ['Groceries & shops', '/shops'],
        ['Clothing & textiles', '/clothing'],
        ['Communities', '/communities'],
        ['Events', '/events'],
        ['Jobs & opportunities', '/jobs'],
      ],
    },
    {
      title: 'Take part',
      links: [
        ['Saved discoveries', '/saved'],
        ['For businesses', '/for-businesses'],
        ['Contribute', '/contribute'],
        ...(user?.role === 'store_owner' || user?.role === 'admin'
          ? [['Merchant workspace', '/merchant']]
          : []),
        ...(user?.role === 'admin'
          ? [['Manager review', '/admin/community']]
          : []),
      ],
    },
    {
      title: 'EthnoMart',
      links: [
        ['About', '/about'],
        ['How it works', '/how-it-works'],
        ['Contact', '/contact'],
        ['Preview privacy', '/privacy'],
        ['Preview terms', '/terms'],
      ],
    },
  ];
  return (
    <div className="em-reference-layout min-h-[100dvh] flex flex-col">
      <ReferenceHeader
        accountHref={account}
        signedIn={!!user}
        onLogout={signOut}
      />
      <main ref={main} id="main-content" tabIndex={-1} className="flex-1">
        {location !== '/' && (
          <nav className="em-site-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {pageTrail(location).map((item, index) => (
                <li key={item.label}>
                  {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
                  {item.href ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {children}
      </main>
      <footer className="em-m-footer">
        <div className="em-m-footer-inner">
          <div className="em-m-footer-brand">
            <Link href="/" aria-label="EthnoMart home">
              <img
                src={`${import.meta.env.BASE_URL}brand/ethnomart-logo.png`}
                width={2000}
                height={435}
                alt="EthnoMart"
                loading="lazy"
              />
            </Link>
            <p>
              Familiar shops, cultural clothing, shared stories and local
              possibilities. A little closer to what feels like home.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h2>{g.title}</h2>
              <ul>
                {g.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="em-m-footer-bottom">
          <span>
            © {new Date().getFullYear()} EthnoMart ·{' '}
            {import.meta.env.DEV ? 'Local preview' : 'Website preview'}
          </span>
          <span>
            Fictional sample listings · AI concept photos · No orders, bookings
            or real applications
          </span>
        </div>
      </footer>
    </div>
  );
}
