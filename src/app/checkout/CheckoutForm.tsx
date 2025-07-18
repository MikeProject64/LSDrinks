'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { processCheckout } from '@/actions/payment-actions';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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

interface CheckoutFormProps {
    deliveryInfo: {
        customerName: string;
        customerPhone: string;
        customerAddress: string;
    };
    onSuccess: (orderId: string) => void;
    onFinalizing: () => void;
}

export default function CheckoutForm({ deliveryInfo, onSuccess, onFinalizing }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalWithFee } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setErrorMessage("Stripe não foi carregado corretamente.");
      return;
    }
    
    setIsLoading(true);
    onFinalizing();
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage("Elemento de cartão não encontrado.");
      setIsLoading(false);
      return;
    }

    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (paymentMethodError) {
      setErrorMessage(paymentMethodError.message || "Ocorreu um erro ao criar o método de pagamento.");
      toast({ title: 'Erro', description: paymentMethodError.message, variant: 'destructive'});
      setIsLoading(false);
      // NOTE: We don't return to the payment step here, let the user retry on the same screen.
      return;
    }

    try {
      const result = await processCheckout({
        items,
        totalAmount: totalWithFee,
        paymentMethodId: paymentMethod.id,
        ...deliveryInfo
      });

      if (result.success && result.orderId) {
        onSuccess(result.orderId);
      } else {
         throw new Error('A transação falhou após a criação do método de pagamento.');
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message);
      toast({ title: 'Erro no Pagamento', description: error.message, variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <h3 className="text-lg font-semibold">Dados do Cartão</h3>
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
