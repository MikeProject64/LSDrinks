'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { type Stripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import CartSummary from './CartSummary';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPaymentSettings } from '@/actions/payment-actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PaymentSettings } from '@/actions/payment-actions';
import { useEffect } from 'react';

interface CheckoutClientPageProps {
  stripePromise: Promise<Stripe | null>;
}

type Step = 'summary' | 'payment-method' | 'payment-form';

export default function CheckoutClientPage({ stripePromise }: CheckoutClientPageProps) {
  const { items } = useCart();
  const [step, setStep] = useState<Step>('summary');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadPaymentSettings() {
      try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
      } catch (error) {
        console.error("Failed to load payment settings", error);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadPaymentSettings();
  }, []);

  // Se o carrinho estiver vazio, mostra uma mensagem
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-8">
          Parece que você ainda não adicionou nenhum item.
        </p>
        <Button asChild>
          <Link href="/">Continuar Comprando</Link>
        </Button>
      </div>
    );
  }
  
  const renderStep = () => {
    switch (step) {
      case 'summary':
        return (
          <Card>
            <CardHeader><CardTitle>1. Resumo do Pedido</CardTitle></CardHeader>
            <CardContent>
              <CartSummary />
              <Button onClick={() => setStep('payment-method')} className="w-full mt-6">
                Ir para Seleção de Pagamento
              </Button>
            </CardContent>
          </Card>
        );
      case 'payment-method':
        if (isLoadingSettings) return <p>Carregando métodos de pagamento...</p>;
        return (
          <Card>
            <CardHeader><CardTitle>2. Método de Pagamento</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentSettings?.isLive && paymentSettings?.stripe?.publicKey && (
                  <Button
                    variant={selectedPayment === 'stripe' ? 'default' : 'outline'}
                    onClick={() => setSelectedPayment('stripe')}
                    className="w-full justify-start p-4 h-auto"
                  >
                    Cartão de Crédito (Stripe)
                  </Button>
                )}
                {/* Outros métodos de pagamento podem ser adicionados aqui */}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('summary')}>Voltar</Button>
                <Button onClick={() => setStep('payment-form')} disabled={!selectedPayment}>
                  Ir para Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'payment-form':
        return (
          <Card>
            <CardHeader><CardTitle>3. Pagamento</CardTitle></CardHeader>
            <CardContent>
              {selectedPayment === 'stripe' && (
                <Elements stripe={stripePromise}>
                  <CheckoutForm />
                </Elements>
              )}
              <Button variant="outline" onClick={() => setStep('payment-method')} className="w-full mt-6">
                Voltar para Seleção de Pagamento
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return <p>Etapa desconhecida.</p>;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Finalizar Compra</h1>
      {renderStep()}
    </div>
  );
} 