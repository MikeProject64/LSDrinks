"use client";

import { withAuth, useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/AdminLayout';

function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
      </div>
      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Bem-vindo(a), {user?.email}!
          </h3>
          <p className="text-sm text-muted-foreground">
            Você pode começar a gerenciar seus produtos e categorias.
          </p>
          <Button onClick={handleLogout} className="mt-4">Sair</Button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(Dashboard);
