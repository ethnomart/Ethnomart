import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowUpRight, Bookmark, Menu } from 'lucide-react';
import { discoveryLinks, isDestinationActive } from '@/lib/site-navigation';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import '@/styles/reference-hero.css';
interface Props {
  accountHref: string;
  signedIn: boolean;
  onLogout: () => void;
}
const logo = `${import.meta.env.BASE_URL}brand/ethnomart-logo.png`;
export function ReferenceHeader({ accountHref, signedIn, onLogout }: Props) {
  const [open, setOpen] = useState(false),
    [location] = useLocation(),
    first = useRef<HTMLAnchorElement>(null),
    openedAt = useRef(location);
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    const mq = window.matchMedia('(min-width:1200px)'),
      close = () => {
        if (mq.matches) setOpen(false);
      };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);
  return (
    <header className="em-reference-header" aria-label="EthnoMart header">
      <a className="em-reference-skip" href="#main-content">
        Skip to content
      </a>
      <div className="em-reference-header-inner">
        <Link
          href="/"
          className="em-reference-brand"
          aria-label="EthnoMart home"
        >
          <img
            className="em-brand-logo-image"
            src={logo}
            width={2000}
            height={435}
            alt="EthnoMart"
            decoding="async"
          />
        </Link>
        <nav className="em-reference-desktop-nav" aria-label="Main navigation">
          {discoveryLinks.map(({ label, href }) => (
            <Link
              href={href}
              key={href}
              aria-current={
                isDestinationActive(location, href) ? 'page' : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="em-reference-header-actions">
          <Link
            href="/saved"
            className="em-reference-saved"
            aria-label="Saved discoveries"
            title="Saved discoveries"
            aria-current={location === '/saved' ? 'page' : undefined}
          >
            <Bookmark size={20} aria-hidden="true" />
          </Link>
          <Link className="em-reference-account" href={accountHref}>
            {signedIn ? 'My account' : 'Sign in'}
          </Link>
          {signedIn && (
            <button
              type="button"
              className="em-reference-account"
              onClick={onLogout}
            >
              Log out
            </button>
          )}
          <Link className="em-reference-header-cta" href="/for-businesses">
            For businesses
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Sheet
            open={open}
            onOpenChange={(next) => {
              if (next) openedAt.current = location;
              setOpen(next);
            }}
          >
            <SheetTrigger asChild>
              <button
                className="em-reference-menu-trigger"
                aria-label="Open navigation menu"
              >
                <Menu size={25} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              className="em-reference-menu"
              side="right"
              onCloseAutoFocus={(event) => {
                if (openedAt.current !== location) {
                  event.preventDefault();
                  document
                    .getElementById('main-content')
                    ?.focus({ preventScroll: true });
                }
              }}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                first.current?.focus();
              }}
            >
              <SheetHeader>
                <SheetTitle className="em-reference-menu-title">
                  <img
                    className="em-brand-logo-image"
                    src={logo}
                    width={2000}
                    height={435}
                    alt="EthnoMart"
                  />
                </SheetTitle>
                <SheetDescription className="em-reference-menu-description">
                  Your culture. Your neighbourhood.
                </SheetDescription>
              </SheetHeader>
              <nav
                className="em-reference-mobile-nav"
                aria-label="Mobile navigation"
              >
                {[
                  ...discoveryLinks,
                  { label: 'Saved discoveries', href: '/saved' },
                  {
                    label: signedIn ? 'My account' : 'Sign in',
                    href: accountHref,
                  },
                ].map(({ label, href }, index) => (
                  <SheetClose asChild key={href}>
                    <Link
                      ref={index === 0 ? first : undefined}
                      href={href}
                      aria-current={
                        isDestinationActive(location, href) ? 'page' : undefined
                      }
                    >
                      {label}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </SheetClose>
                ))}
                {signedIn && (
                  <SheetClose asChild>
                    <button onClick={onLogout}>
                      Log out
                      <ArrowUpRight aria-hidden="true" />
                    </button>
                  </SheetClose>
                )}
              </nav>
              <SheetClose asChild>
                <Link className="em-reference-menu-cta" href="/for-businesses">
                  For businesses
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </SheetClose>
              <p className="em-reference-menu-note">
                Familiar places. New connections.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
