'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ShoppingCart, ScrollText } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Cardápio', icon: BookOpen },
  { href: '/checkout', label: 'Carrinho', icon: ShoppingCart },
  { href: '/orders', label: 'Pedidos', icon: ScrollText },
];

const MobileNav = () => {
  const pathname = usePathname();

  // O menu só será renderizado nas rotas principais para não atrapalhar em páginas de formulários complexos, etc.
  const isVisible = navItems.some(item => pathname === item.href);

  if (!isVisible) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-card border-t border-border z-50 flex md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-1 flex-col items-center justify-center text-center p-1"
          >
            <Icon
              className={`h-6 w-6 mb-1 transition-colors group-hover:text-primary ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors group-hover:text-primary ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav; 