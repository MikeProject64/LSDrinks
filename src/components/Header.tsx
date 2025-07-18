'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSettings } from '@/actions/settings-actions';

const Header = () => {
  const [storeName, setStoreName] = useState('LSDrinks');

  useEffect(() => {
    getSettings().then(settings => {
      setStoreName(settings.storeName);
    });
  }, []);

  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 flex items-center justify-center h-16">
        <Link href="/" className="flex flex-col items-center text-center">
          <span className="text-lg font-bold tracking-wider uppercase text-foreground">{storeName}</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
