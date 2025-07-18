'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { processCheckout } from '@/actions/payment-actions';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const cardElementOptions = {
  style: {
    base: {
      iconColor: '#aab7c4',
      color: '#fff',
      fontSize: '16px',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      iconColor: '#ffc7ee',
      color: '#ffc7ee',
    },
  },
  hidePostalCode: true,
};

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

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalWithFee, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!stripe || !elements) {
      setErrorMessage("Stripe não foi carregado corretamente.");
      setIsLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage("Elemento de cartão não encontrado.");
      setIsLoading(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setErrorMessage(error.message || "Ocorreu um erro ao criar o método de pagamento.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await processCheckout({
        items,
        totalAmount: totalWithFee,
        paymentMethodId: paymentMethod.id,
      });

      if (result.success && result.orderId) {
        saveOrderIdLocally(result.orderId);
        toast({ title: 'Sucesso!', description: 'Seu pedido foi realizado com sucesso.' });
        clearCart();
        router.push('/orders');
      } else {
         throw new Error(result.orderId || 'A transação falhou.');
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message);
      toast({ title: 'Erro no Pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <h2 className="text-xl font-semibold">Pagamento com Cartão</h2>
      <div className="p-4 border rounded-lg bg-background">
        <CardElement options={cardElementOptions} />
      </div>
      {errorMessage && <div className="text-red-500 text-sm font-medium">{errorMessage}</div>}
      <Button type="submit" disabled={!stripe || isLoading || items.length === 0} className="w-full" size="lg">
        {isLoading ? 'Processando...' : `Pagar R$ ${totalWithFee.toFixed(2)}`}
      </Button>
    </form>
  );
}