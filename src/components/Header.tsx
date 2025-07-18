'use client';

import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 flex items-center justify-center h-16">
        <Link href="/" className="flex flex-col items-center text-center">
          <span className="text-lg font-bold tracking-wider uppercase text-foreground">LSDrinks</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
