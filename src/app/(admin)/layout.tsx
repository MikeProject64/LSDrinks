'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Tag, BarChart, Loader2 } from 'lucide-react';
import { useSignOut } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [signOut] = useSignOut(auth);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Se não estiver carregando e não houver usuário, redireciona para o login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleSignOut = async () => {
    const success = await signOut();
    if (success) {
      router.push('/login');
    }
  };
  
  // Mostra um loader enquanto o status do usuário está sendo verificado
  // ou se o usuário for nulo (o que significa que o redirecionamento está prestes a acontecer).
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Neste ponto, o carregamento terminou e o usuário existe, então é seguro renderizar o layout.
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r p-4 flex-col hidden md:flex">
        <h2 className="text-2xl font-bold mb-8">Admin</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/admin">
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
  );
};

export default AdminLayout; 