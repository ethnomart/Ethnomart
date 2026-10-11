import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowUpRight, Menu } from 'lucide-react';
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
  plain?: boolean;
}
const logo = `${import.meta.env.BASE_URL}brand/ethnomart-logo.png`;
const links = [
  ['Explore', '/explore'],
  ['Communities', '/communities'],
  ['Events', '/events'],
  ['Jobs', '/jobs'],
];
export function ReferenceHeader({
  accountHref,
  signedIn,
  onLogout,
  plain = false,
}: Props) {
  const [open, setOpen] = useState(false),
    [location] = useLocation(),
    first = useRef<HTMLAnchorElement>(null);
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    const mq = window.matchMedia('(min-width:1100px)'),
      close = () => {
        if (mq.matches) setOpen(false);
      };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);
  return (
    <header
      className={`em-reference-header${plain ? ' em-reference-header--plain' : ''}`}
      aria-label="EthnoMart header"
    >
      <a className="em-reference-skip" href="#main-content">
        Skip to content
      </a>
      <Link href="/" className="em-reference-brand" aria-label="EthnoMart home">
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
        {links.map(([label, href]) => (
          <Link
            href={href}
            key={href}
            aria-current={location === href ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
        <Link href={accountHref}>{signedIn ? 'My account' : 'Log in'}</Link>
        {signedIn && <button onClick={onLogout}>Log out</button>}
      </nav>
      <Link className="em-reference-header-cta" href="/for-businesses">
        For businesses
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
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
              ...links,
              ['Clothing', '/clothing'],
              ['Saved', '/saved'],
              [signedIn ? 'My account' : 'Log in', accountHref],
            ].map(([label, href], index) => (
              <SheetClose asChild key={href}>
                <Link ref={index === 0 ? first : undefined} href={href}>
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
    </header>
  );
}
