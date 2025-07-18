'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Elements } from '@stripe/react-stripe-js';
import { type Stripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

import CheckoutForm from './CheckoutForm';
import CartSummary from './CartSummary';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getPaymentSettings, PaymentSettings, processCheckout } from '@/actions/payment-actions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface CheckoutClientPageProps {
  stripePromise: Promise<Stripe | null>;
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

export default function CheckoutClientPage({ stripePromise }: CheckoutClientPageProps) {
  const { items, totalWithFee, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>('summary');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFormValues | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
        customerName: '',
        customerPhone: '',
        customerAddress: ''
    }
  });

  useEffect(() => {
    async function loadPaymentSettings() {
      setIsLoading(true);
      try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
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
      const result = await processCheckout({
        items,
        totalAmount: totalWithFee,
        paymentMethodId: 'on_delivery',
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
                                      <Button
                                          variant={selectedPayment === 'on_delivery' ? 'default' : 'outline'}
                                          onClick={() => setSelectedPayment('on_delivery')}
                                          className="w-full justify-start p-4 h-auto text-left"
                                      >
                                          Pagar na Entrega
                                          <span className="text-xs text-muted-foreground block">Pague com PIX ou dinheiro quando receber.</span>
                                      </Button>
                                  )}
                                  {paymentSettings?.isLive && paymentSettings.stripe.publicKey && (
                                      <Button
                                          variant="outline"
                                          onClick={() => setSelectedPayment('stripe')}
                                          className="w-full justify-start p-4 h-auto text-left"
                                      >
                                          Cartão de Crédito
                                          <span className="text-xs text-muted-foreground block">Pagamento seguro com Stripe.</span>
                                      </Button>
                                  )}
                                  {noPaymentMethods && (
                                      <p className='text-center text-muted-foreground'>Nenhum método de pagamento habilitado.</p>
                                  )}
                              </div>
                          )}
                          {selectedPayment === 'stripe' && deliveryInfo && (
                               <Elements stripe={stripePromise}>
                                  <CheckoutForm
                                    deliveryInfo={deliveryInfo}
                                    onSuccess={handleStripeSuccess}
                                    onFinalizing={() => setStep('finalizing')}
                                    />
                               </Elements>
                          )}
                      </>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                       <Button variant="outline" onClick={() => { setSelectedPayment(null); setStep('delivery'); }} className="w-full sm:w-auto">Voltar</Button>
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
