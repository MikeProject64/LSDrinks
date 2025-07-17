'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Tag, BarChart } from 'lucide-react';
import { useSignOut } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [signOut] = useSignOut(auth);
  const router = useRouter();

  const handleSignOut = async () => {
    const success = await signOut();
    if (success) {
      router.push('/login');
    }
  };
  
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <aside className="w-64 bg-card border-r p-4 flex-col hidden md:flex">
          <h2 className="text-2xl font-bold mb-8">Admin</h2>
          <nav className="flex flex-col gap-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <BarChart className="h-5 w-5" /> Dashboard
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Package className="h-5 w-5" /> Produtos
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Tag className="h-5 w-5" /> Categorias
              </Button>
            </Link>
          </nav>
          <div className="mt-auto">
              <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                  Sair
              </Button>
          </div>
        </aside>
        <main className="flex-1 p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
};

export default AdminLayout; 