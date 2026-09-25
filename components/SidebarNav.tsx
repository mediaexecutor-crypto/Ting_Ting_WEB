'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: '🏠 Dashboard' },
  { href: '/orders', label: '📦 Orders' },
  { href: '/customers', label: '👤 Customers' },
  { href: '/deliveries', label: '🚚 Deliveries' },
  { href: '/calendar', label: '📅 Calendar' },
  { href: '/drive', label: '📁 Drive Storage' },
  { href: '/reports', label: '📊 Reports' },
  { href: '/settings', label: '⚙️ Settings' },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {LINKS.map((link) => {
        // '/' should only be active on the exact dashboard route, every
        // other link is active on itself and its sub-routes (e.g.
        // /orders/123 keeps Orders highlighted).
        const isActive =
          link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

        return (
          <Link key={link.href} href={link.href} className={isActive ? 'active' : ''}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
