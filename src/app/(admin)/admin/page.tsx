import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const AdminDashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Painel de Controle</CardTitle>
          <CardDescription>
            Use o menu à esquerda para gerenciar produtos, categorias e mais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Este é o seu centro de operações. Daqui, você pode controlar todos os aspectos da sua loja.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage; 