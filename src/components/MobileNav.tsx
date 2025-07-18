'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ShoppingCart, ScrollText } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Cardápio', icon: BookOpen },
  { href: '/checkout', label: 'Carrinho', icon: ShoppingCart },
  { href: '/orders', label: 'Pedidos', icon: ScrollText },
];

const MobileNav = () => {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    // This runs only on the client, so window and localStorage are available.
    const orderIdsString = localStorage.getItem('myOrderIds');
    if (orderIdsString) {
      try {
        const orderIds = JSON.parse(orderIdsString);
        setOrderCount(orderIds.length);
      } catch (e) {
        setOrderCount(0);
      }
    }
  }, []);


  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-card border-t border-border z-50 flex md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex flex-1 flex-col items-center justify-center text-center p-1"
          >
            <Icon
              className={`h-6 w-6 mb-1 transition-colors group-hover:text-primary ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            {item.href === '/checkout' && cartCount > 0 && (
              <Badge
                variant="default"
                className="absolute top-1 right-[calc(50%-2rem)] h-5 w-5 flex items-center justify-center p-1 text-xs"
              >
                {cartCount}
              </Badge>
            )}
             {item.href === '/orders' && orderCount > 0 && (
              <Badge
                variant="default"
                className="absolute top-1 right-[calc(50%-2rem)] h-5 w-5 flex items-center justify-center p-1 text-xs"
              >
                {orderCount}
              </Badge>
            )}
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
