'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const [signInWithEmailAndPassword, , loading, error] = useSignInWithEmailAndPassword(auth);
  const { user: authUser, loading: authLoading } = useAuth();
  
  const { toast } = useToast();

  useEffect(() => {
    // Se o usuário já estiver logado e o carregamento inicial terminou,
    // redireciona para o dashboard.
    if (!authLoading && authUser) {
      router.push('/admin/dashboard');
    }
  }, [authUser, authLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signInWithEmailAndPassword(email, password);
    if (res) {
      toast({ title: "Login bem-sucedido!" });
      router.push('/admin/dashboard');
    } else if (error) {
      const errorCode = error.code;
      if (errorCode === 'auth/invalid-credential') {
        toast({
          variant: "destructive",
          title: "Credenciais Inválidas",
          description: "O e-mail ou a senha estão incorretos.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message || "Ocorreu um problema inesperado.",
        });
      }
    }
  };

  // Se o carregamento da autenticação estiver acontecendo, ou se já houver um usuário
  // (e o redirecionamento estiver prestes a acontecer), mostre um loader.
  if (authLoading || authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Acesse o painel de controle</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage; 