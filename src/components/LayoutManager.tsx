"use client";

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from './ui/toaster';
import { StoreSettings } from '@/actions/settings-actions';

export default function LayoutManager({ 
  children,
  settings 
}: { 
  children: React.ReactNode,
  settings: StoreSettings
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';
  const isCheckoutPage = pathname === '/checkout';

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAdminPage) {
    // Para as páginas de admin, o AdminLayout é aplicado internamente
    // e precisa do nome da loja.
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        {!isCheckoutPage && <Header storeName={settings.storeName} />}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-8">
          {children}
        </main>
        <Footer storeName={settings.storeName} />
        <Toaster />
        <MobileNav />
      </div>
    </CartProvider>
  );
}
