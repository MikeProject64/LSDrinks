
'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement, PaymentElement } from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { saveOrder } from '@/actions/payment-actions';
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
    totalAmount: number;
    orderId: string;
    onSuccess: (orderId: string) => void;
    onFinalizing: () => void;
}

export default function CheckoutForm({ deliveryInfo, totalAmount, orderId, onSuccess, onFinalizing }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { items } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      toast({ title: "Erro", description: "Stripe não foi carregado.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    onFinalizing();
    setErrorMessage(null);
    
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message || "Ocorreu um erro ao submeter o formulário.");
      setIsLoading(false);
      return;
    }

    // A chamada para criar o PaymentIntent já foi feita.
    // Agora confirmamos o pagamento usando o clientSecret passado para o <Elements> provider.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required' // Evita redirecionamento, crucial para SPAs
    });

    if (confirmError) {
      setErrorMessage(confirmError.message || "Falha na confirmação do pagamento.");
      toast({ title: 'Erro', description: confirmError.message, variant: 'destructive'});
      setIsLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const result = await saveOrder({
          items,
          totalAmount: totalAmount,
          paymentMethod: 'stripe',
          orderId: orderId,
          stripePaymentIntentId: paymentIntent.id,
          ...deliveryInfo
        });
  
        if (result.success && result.orderId) {
          onSuccess(result.orderId);
        } else {
           throw new Error('O pagamento foi processado, mas falhou ao salvar o pedido.');
        }
      } catch (err) {
        const error = err as Error;
        setErrorMessage(error.message);
        toast({ title: 'Erro Pós-Pagamento', description: error.message, variant: 'destructive' });
        setIsLoading(false);
      }
    } else {
        setErrorMessage(`Status do pagamento: ${paymentIntent?.status ?? 'desconhecido'}`);
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <h3 className="text-lg font-semibold">Dados do Cartão</h3>
      <div className="p-4 border rounded-lg bg-background">
        <PaymentElement />
      </div>
      {errorMessage && <div className="text-red-500 text-sm font-medium">{errorMessage}</div>}
      <Button type="submit" disabled={!stripe || isLoading || items.length === 0} className="w-full" size="lg">
        {isLoading ? 'Processando...' : `Pagar R$ ${totalAmount.toFixed(2)}`}
      </Button>
    </form>
  );
}
