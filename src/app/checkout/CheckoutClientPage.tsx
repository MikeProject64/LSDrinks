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

  const renderContent = () => {
    switch(step) {
        case 'summary':
            return (
                <Card>
                    <CardHeader><CardTitle>1. Resumo do Pedido</CardTitle></CardHeader>
                    <CardContent>
                      <CartSummary />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => setStep('delivery')} className="w-full">
                            Próximo: Entrega
                        </Button>
                    </CardFooter>
                </Card>
            )
        case 'delivery':
            return (
                <Card>
                    <CardHeader><CardTitle>2. Informações de Entrega</CardTitle></CardHeader>
                    <Form {...deliveryForm}>
                        <form onSubmit={deliveryForm.handleSubmit(onDeliverySubmit)}>
                            <CardContent className="space-y-4">
                                <FormField control={deliveryForm.control} name="customerName" render={({ field }) => (
                                    <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={deliveryForm.control} name="customerPhone" render={({ field }) => (
                                    <FormItem><FormLabel>Telefone (WhatsApp)</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={deliveryForm.control} name="customerAddress" render={({ field }) => (
                                    <FormItem><FormLabel>Endereço de Entrega</FormLabel><FormControl><Input placeholder="Rua, Número, Bairro, Complemento..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep('summary')}>Voltar</Button>
                                <Button type="submit">Próximo: Pagamento</Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            )
        case 'payment':
            const noPaymentMethods = !paymentSettings?.isLive && !paymentSettings.isPaymentOnDeliveryEnabled;
            return (
                <Card>
                    <CardHeader><CardTitle>3. Método de Pagamento</CardTitle></CardHeader>
                    <CardContent>
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
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button variant="outline" onClick={() => { setSelectedPayment(null); setStep('delivery'); }}>Voltar</Button>
                         {selectedPayment === 'on_delivery' && (
                             <Button onClick={handlePaymentOnDelivery} disabled={isLoading}>
                                 {isLoading ? 'Finalizando...' : 'Finalizar Pedido'}
                             </Button>
                         )}
                    </CardFooter>
                </Card>
            )
        case 'finalizing':
             return (
                <Card>
                    <CardHeader><CardTitle>Finalizando Pedido...</CardTitle></CardHeader>
                    <CardContent>
                        <p>Por favor, aguarde enquanto processamos seu pedido. Não feche esta página.</p>
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Finalizar Compra</h1>
      {renderContent()}
    </div>
  );
}