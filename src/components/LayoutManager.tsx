"use client";

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from './ui/toaster';

export default function LayoutManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isCheckoutPage = pathname === '/checkout';

  if (isAdminPage) {
    // Para as páginas de admin, renderizamos apenas o conteúdo,
    // pois o layout específico (AdminLayout) já está sendo aplicado
    // dentro da própria página do dashboard. A página de login não tem layout.
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        {!isCheckoutPage && <Header />}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-8">
          {children}
        </main>
        <Footer />
        <Toaster />
        {/* O MobileNav agora é sempre exibido em páginas não-admin */}
        <MobileNav />
      </div>
    </CartProvider>
  );
}
