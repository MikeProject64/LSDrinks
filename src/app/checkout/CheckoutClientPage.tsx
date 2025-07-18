'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { type Stripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import CartSummary from './CartSummary';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPaymentSettings, PaymentSettings, processCheckout } from '@/actions/payment-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CheckoutClientPageProps {
  stripePromise: Promise<Stripe | null>;
}

type Step = 'summary' | 'payment-method' | 'payment-form' | 'processing';

const saveOrderIdLocally = (orderId: string) => {
    try {
      const existingOrderIds = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
      if (!existingOrderIds.includes(orderId)) {
        const updatedOrderIds = [...existingOrderIds, orderId];
        localStorage.setItem('myOrderIds', JSON.stringify(updatedOrderIds));
      }
    } catch (e) {
      console.error("Failed to save order ID to local storage", e);
    }
};

export default function CheckoutClientPage({ stripePromise }: CheckoutClientPageProps) {
  const { items, totalWithFee, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>('summary');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPaymentSettings() {
      setIsLoading(true);
      try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
      } catch (error) {
        console.error("Failed to load payment settings", error);
        toast({ title: "Erro", description: "Não foi possível carregar os métodos de pagamento.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadPaymentSettings();
  }, []);

  const handlePaymentOnDelivery = async () => {
    setIsLoading(true);
    setStep('processing');
    try {
      const result = await processCheckout({
        items,
        totalAmount: totalWithFee,
        paymentMethodId: 'on_delivery',
      });

      if (result.success && result.orderId) {
        saveOrderIdLocally(result.orderId);
        toast({ title: 'Sucesso!', description: 'Seu pedido foi realizado e será pago na entrega.' });
        clearCart();
        router.push('/orders');
      } else {
         throw new Error('A transação falhou.');
      }
    } catch (err) {
      const error = err as Error;
      toast({ title: 'Erro no Pedido', description: error.message, variant: 'destructive' });
      setStep('payment-method'); // Volta para a seleção
    } finally {
      setIsLoading(false);
    }
  };
  
  const proceedToNextStep = () => {
    if (selectedPayment === 'on_delivery') {
      handlePaymentOnDelivery();
    } else {
      setStep('payment-form');
    }
  }

  if (items.length === 0 && step !== 'processing') {
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
    if (isLoading && step !== 'processing') {
      return (
        <Card>
          <CardHeader><CardTitle>Carregando...</CardTitle></CardHeader>
          <CardContent><p>Aguarde um momento.</p></CardContent>
        </Card>
      );
    }

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
                {paymentSettings?.isPaymentOnDeliveryEnabled && (
                   <Button
                    variant={selectedPayment === 'on_delivery' ? 'default' : 'outline'}
                    onClick={() => setSelectedPayment('on_delivery')}
                    className="w-full justify-start p-4 h-auto"
                  >
                    Pagamento na Entrega (PIX ou Dinheiro)
                  </Button>
                )}
                 {!paymentSettings?.isLive && !paymentSettings?.isPaymentOnDeliveryEnabled && (
                    <p className='text-center text-muted-foreground'>Nenhum método de pagamento está habilitado no momento.</p>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('summary')}>Voltar</Button>
                <Button onClick={proceedToNextStep} disabled={!selectedPayment || isLoading}>
                  {isLoading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'payment-form': // Apenas para Stripe agora
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
                Trocar Método de Pagamento
              </Button>
            </CardContent>
          </Card>
        );
       case 'processing':
        return (
          <Card>
            <CardHeader><CardTitle>Processando seu Pedido...</CardTitle></CardHeader>
            <CardContent>
              <p>Por favor, aguarde enquanto finalizamos seu pedido.</p>
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