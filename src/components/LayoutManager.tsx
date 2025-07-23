"use client";

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { StoreSettings } from '@/actions/settings-actions';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

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
    return (
      <AuthProvider>
          {children}
      </AuthProvider>
    );
  }

  if (isAdminPage) {
     return (
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          {!isCheckoutPage && <Header storeName={settings.storeName} />}
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-8">
            {children}
          </main>
          <Footer storeName={settings.storeName} />
          <MobileNav />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
