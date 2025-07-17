'use client';

import Link from 'next/link';
import { CupSoda } from 'lucide-react';
import GeoLocator from './GeoLocator';
import ShoppingCart from './ShoppingCart';

const Header = () => {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <CupSoda className="h-8 w-8 text-primary group-hover:animate-pulse" />
            <span className="text-2xl font-bold font-headline text-foreground group-hover:text-primary transition-colors">
              LSDrinks
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <GeoLocator />
          <ShoppingCart />
        </div>
      </div>
    </header>
  );
};

export default Header;
