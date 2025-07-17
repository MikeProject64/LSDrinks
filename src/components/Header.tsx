'use client';

import Link from 'next/link';
import { CupSoda } from 'lucide-react';
import GeoLocator from './GeoLocator';

const Header = () => {
  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Espaçador para manter o título centralizado. Ajuste a largura (w-10) se necessário. */}
        <div className="w-10"></div> 

        <Link href="/" className="flex flex-col items-center text-center">
          <span className="text-lg font-bold tracking-wider uppercase text-foreground">LSDrinks</span>
        </Link>
        
        {/* Ícone do carrinho removido. Este div serve como espaçador. */}
        <div className="w-10"></div> 
      </div>
    </header>
  );
};

export default Header;
