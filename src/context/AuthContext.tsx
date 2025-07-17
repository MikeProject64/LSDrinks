"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const withAuth = (WrappedComponent: React.ComponentType) => {
    return (props: any) => {
      const { user, loading } = useAuth();
      const router = useRouter();
      const pathname = usePathname();
  
      useEffect(() => {
        // Se não está carregando e não há usuário, e a rota atual não é a de login,
        // então redireciona para o login.
        if (!loading && !user && pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }, [user, loading, router, pathname]);
  
      // Se estiver carregando, mostra um spinner ou mensagem.
      if (loading) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div>Loading...</div>
          </div>
        );
      }
  
      // Se não houver usuário e estivermos em uma página protegida,
      // não renderiza nada, pois o redirecionamento já foi disparado.
      if (!user && pathname !== '/admin/login') {
        return null;
      }
  
      // Renderiza o componente se o usuário estiver logado.
      return <WrappedComponent {...props} />;
    };
  };