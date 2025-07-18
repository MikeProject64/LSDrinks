
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Elements } from '@stripe/react-stripe-js';
import { type Stripe, loadStripe, type Appearance } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

import CheckoutForm from './CheckoutForm';
import CartSummary from './CartSummary';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getPaymentSettings, PaymentSettings, saveOrder } from '@/actions/payment-actions';
import { createPaymentIntent } from '@/actions/create-payment-intent';
import { toast } from '@/hooks/use-toast';

interface CheckoutClientPageProps {
  // We no longer pass the promise from the server page
}

type Step = 'summary' | 'delivery' | 'payment' | 'finalizing';

const deliveryFormSchema = z.object({
    customerName: z.string().min(3, "Nome completo é obrigatório."),
    customerPhone: z.string().min(10, "Telefone é obrigatório."),
    customerAddress: z.string().min(10, "Endereço completo é obrigatório."),
});
type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;


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

export default function CheckoutClientPage({}: CheckoutClientPageProps) {
  const { items, totalWithFee, clearCart, cartTotal } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>('summary');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFormValues | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Stripe
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [stripeTotal, setStripeTotal] = useState<number>(0);


  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
        customerName: '',
        customerPhone: '',
        customerAddress: ''
    }
  });

  const appearance: Appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#f97316', // Laranja da logo (accent)
      colorBackground: '#090e18', // Cor do card
      colorText: '#f7f9fa',
      colorDanger: '#e53e3e',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '0.5rem',
    },
    rules: {
      '.Input': {
        backgroundColor: '#1e293b', // Cor do input
        border: '1px solid #1e293b',
      }
    }
  };

  useEffect(() => {
    async function loadPaymentSettings() {
      setIsLoading(true);
      try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
        if (settings?.isLive && settings.stripe?.publicKey) {
            setStripePromise(loadStripe(settings.stripe.publicKey));
        }
      } catch (error) {
        console.error("Failed to load payment settings", error);
        toast({ title: "Erro", description: "Não foi possível carregar as configurações.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadPaymentSettings();
  }, []);

  const onDeliverySubmit = (data: DeliveryFormValues) => {
    setDeliveryInfo(data);
    setStep('payment');
  }

  const handlePaymentOnDelivery = async () => {
    if (!deliveryInfo) return;
    setStep('finalizing');
    try {
      function generateOrderId() {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const numbers = Math.floor(1000 + Math.random() * 9000);
        return `${letter}${numbers}`;
      }
      const orderId = generateOrderId();
      
      const result = await saveOrder({
        items,
        totalAmount: totalWithFee,
        paymentMethod: 'on_delivery',
        orderId,
        ...deliveryInfo
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
      setStep('payment'); // Volta para a seleção
    }
  };

  const handleStripeSelect = async () => {
    if (items.length === 0) {
      toast({ title: "Erro", description: "Seu carrinho está vazio.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
        const intent = await createPaymentIntent({ items });
        setClientSecret(intent.clientSecret);
        setStripeTotal(intent.totalAmount);
        setStripeOrderId(intent.orderId);
        setSelectedPayment('stripe');
    } catch (error: any) {
        toast({ title: "Erro de Pagamento", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleStripeSuccess = (orderId: string) => {
    saveOrderIdLocally(orderId);
    toast({ title: 'Sucesso!', description: 'Seu pedido foi realizado com sucesso.' });
    clearCart();
    router.push('/orders');
  };

  if (items.length === 0 && step !== 'finalizing') {
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
  
  const stepTitles: Record<Step, string> = {
    summary: '1. Resumo do Pedido',
    delivery: '2. Informações de Entrega',
    payment: '3. Método de Pagamento',
    finalizing: 'Finalizando Pedido...'
  };

  const renderContent = () => {
    switch(step) {
        case 'summary':
            return (
                <div className="space-y-8">
                  <CartSummary />
                  <Button onClick={() => setStep('delivery')} className="w-full" size="lg">
                      Próximo: Entrega
                  </Button>
                </div>
            )
        case 'delivery':
            return (
                <Form {...deliveryForm}>
                    <form onSubmit={deliveryForm.handleSubmit(onDeliverySubmit)} className="space-y-8">
                        <div className="space-y-4">
                            <FormField control={deliveryForm.control} name="customerName" render={({ field }) => (
                                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={deliveryForm.control} name="customerPhone" render={({ field }) => (
                                <FormItem><FormLabel>Telefone (WhatsApp)</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={deliveryForm.control} name="customerAddress" render={({ field }) => (
                                <FormItem><FormLabel>Endereço de Entrega</FormLabel><FormControl><Input placeholder="Rua, Número, Bairro, Complemento..." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                            <Button variant="outline" onClick={() => setStep('summary')} className="w-full sm:w-auto">Voltar</Button>
                            <Button type="submit" className="w-full sm:w-auto">Próximo: Pagamento</Button>
                        </div>
                    </form>
                </Form>
            )
        case 'payment':
            const noPaymentMethods = !paymentSettings?.isLive && !paymentSettings.isPaymentOnDeliveryEnabled;
            return (
              <div className="space-y-8">
                  {isLoading ? <p>Carregando...</p> : (
                      <>
                          {selectedPayment !== 'stripe' && (
                              <div className="space-y-4">
                                  {paymentSettings?.isPaymentOnDeliveryEnabled && (
                                      <button
                                          onClick={() => setSelectedPayment('on_delivery')}
                                          className="w-full flex flex-col items-center justify-center p-6 rounded-lg border-2 border-muted hover:border-primary transition-colors bg-card"
                                      >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-primary">
                                            <path d="M2 6h20M7 12h10M9 18h6" />
                                            <path d="M2 6v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                                          </svg>
                                          <span className="font-semibold">Pagar na Entrega</span>
                                          <span className="text-xs text-muted-foreground">PIX ou dinheiro ao receber.</span>
                                      </button>
                                  )}
                                  {paymentSettings?.isLive && paymentSettings.stripe?.publicKey && (
                                      <button
                                        onClick={handleStripeSelect}
                                        disabled={isLoading}
                                        className="w-full flex flex-col items-center justify-center p-6 rounded-lg border-2 border-muted hover:border-primary transition-colors bg-card disabled:opacity-50"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-primary">
                                            <rect width="20" height="14" x="2" y="5" rx="2"/>
                                            <line x1="2" x2="22" y1="10" y2="10"/>
                                        </svg>
                                        <span className="font-semibold">Cartão de Crédito</span>
                                        <span className="text-xs text-muted-foreground">Pagamento seguro com Stripe.</span>
                                      </button>
                                  )}
                                  {noPaymentMethods && (
                                      <p className='text-center text-muted-foreground'>Nenhum método de pagamento habilitado.</p>
                                  )}
                              </div>
                          )}
                          {selectedPayment === 'stripe' && deliveryInfo && clientSecret && stripePromise && stripeOrderId && (
                               <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                                  <CheckoutForm
                                    deliveryInfo={deliveryInfo}
                                    onSuccess={handleStripeSuccess}
                                    onFinalizing={() => setStep('finalizing')}
                                    totalAmount={stripeTotal}
                                    orderId={stripeOrderId}
                                    />
                               </Elements>
                          )}
                      </>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                       <Button variant="outline" onClick={() => { setSelectedPayment(null); setClientSecret(null); setStep('delivery'); }} className="w-full sm:w-auto">Voltar</Button>
                       {selectedPayment === 'on_delivery' && (
                           <Button onClick={handlePaymentOnDelivery} disabled={isLoading} className="w-full sm:w-auto">
                               {isLoading ? 'Finalizando...' : 'Finalizar Pedido'}
                           </Button>
                       )}
                  </div>
              </div>
            )
        case 'finalizing':
             return (
                <div className="text-center space-y-4">
                    <p>Por favor, aguarde enquanto processamos seu pedido. Não feche esta página.</p>
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    </div>
                </div>
            )
    }
  }

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold text-center">{stepTitles[step]}</h1>
      <div className="border rounded-lg p-6 sm:p-8">
        {renderContent()}
      </div>
    </div>
  );
}
