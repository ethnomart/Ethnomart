export const discoveryLinks = [
  { label: 'Explore', href: '/explore' },
  { label: 'Shops', href: '/shops' },
  { label: 'Clothing', href: '/clothing' },
  { label: 'Communities', href: '/communities' },
  { label: 'Events', href: '/events' },
  { label: 'Jobs', href: '/jobs' },
];

export function isDestinationActive(path: string, href: string) {
  if (path === href) return true;
  if (href === '/communities') return path.startsWith('/community/');
  if (href === '/shops') return path.startsWith('/store/');
  return path.startsWith(href + '/');
}

export function pageTrail(path: string): { label: string; href?: string }[] {
  if (path === '/') return [];
  const labels: Record<string, string> = {
    '/explore': 'Explore',
    '/shops': 'Shops',
    '/clothing': 'Clothing',
    '/communities': 'Communities',
    '/events': 'Events',
    '/jobs': 'Jobs',
    '/saved': 'Saved discoveries',
    '/about': 'About',
    '/how-it-works': 'How it works',
    '/contact': 'Contact',
    '/privacy': 'Preview privacy',
    '/terms': 'Preview terms',
    '/for-businesses': 'For businesses',
    '/for-shops': 'For businesses',
    '/contribute': 'Contribute',
    '/login': 'Sign in',
    '/register': 'Account information',
    '/checkout': 'Checkout preview',
    '/orders': 'Order preview',
    '/dashboard/store': 'Merchant workspace',
    '/dashboard/rider': 'Delivery preview',
    '/dashboard/admin': 'Manager review',
    '/pilot/apply': 'Merchant trial',
    '/merchant': 'Merchant workspace',
    '/admin/access': 'Manager access',
    '/admin/merchant-pilot': 'Merchant review',
    '/admin/community': 'Community review',
  };
  const trail: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
  ];
  if (labels[path]) return [...trail, { label: labels[path] }];
  if (path.startsWith('/store/')) {
    trail.push({ label: 'Shops', href: '/shops' });
    if (path.includes('/product/'))
      trail.push({ label: 'Shop', href: path.split('/product/')[0] });
    return [
      ...trail,
      {
        label: path.includes('/product/') ? 'Product details' : 'Shop details',
      },
    ];
  }
  for (const [prefix, label, href] of [
    ['/community/', 'Community hub', '/communities'],
    ['/events/', 'Event details', '/events'],
    ['/jobs/', 'Opportunity details', '/jobs'],
    ['/merchant/', 'Workspace', '/merchant'],
    ['/admin/', 'Manager workspace', '/admin/merchant-pilot'],
  ]) {
    if (path.startsWith(prefix)) {
      trail.push({ label: labels[href], href });
      return [...trail, { label }];
    }
  }
  return [...trail, { label: 'EthnoMart' }];
}
