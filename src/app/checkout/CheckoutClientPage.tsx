
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { type Stripe, loadStripe, type Appearance } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

import CartSummary from './CartSummary';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getPaymentSettings, PaymentSettings, saveOrder } from '@/actions/payment-actions';
import { createPaymentIntent } from '@/actions/create-payment-intent';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';
import PaymentOnDeliveryModal from './PaymentOnDeliveryModal';

interface CheckoutClientPageProps {}

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

const StripeForm = ({ onFinalizing, onSuccess, deliveryInfo, totalAmount, orderId }: { 
    onFinalizing: () => void; 
    onSuccess: (orderId: string) => void;
    deliveryInfo: DeliveryFormValues;
    totalAmount: number;
    orderId: string;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const { items } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!stripe || !elements) {
            toast({ title: "Erro", description: "Stripe não foi carregado. Tente novamente.", variant: "destructive" });
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

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required'
        });

        if (confirmError) {
            setErrorMessage(confirmError.message || "Falha na confirmação do pagamento.");
            toast({ title: 'Erro de Pagamento', description: confirmError.message, variant: 'destructive'});
            setIsLoading(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            try {
                const result = await saveOrder({
                    items,
                    totalAmount,
                    paymentMethod: 'stripe',
                    paymentDetails: 'Pago com Cartão',
                    orderId,
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
            <div>
                <PaymentElement />
            </div>
            {errorMessage && <div className="text-red-500 text-sm font-medium">{errorMessage}</div>}
            
            <div className="space-y-4">
                <Button type="submit" disabled={!stripe || isLoading || items.length === 0} className="w-full" size="lg">
                    {isLoading ? 'Processando...' : `Pagar R$ ${totalAmount.toFixed(2)}`}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Pagamento seguro via Stripe. Compra 100% garantida.</span>
                </div>
            </div>
        </form>
    );
};


export default function CheckoutClientPage({}: CheckoutClientPageProps) {
  const { items, totalWithFee, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>('summary');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFormValues | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'on_delivery' | 'stripe' | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [stripeTotal, setStripeTotal] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: { customerName: '', customerPhone: '', customerAddress: '' }
  });

  const appearance: Appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#008080',
      colorBackground: '#222222',
      colorText: '#ffffff',
      colorDanger: '#e53e3e',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '0.5rem',
    },
    rules: {
      '.Input': { backgroundColor: '#333333', border: '1px solid #444444' }
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

  const prepareStripePayment = () => {
    if (items.length > 0) {
        setIsLoading(true);
        createPaymentIntent({ items })
            .then(intent => {
                setClientSecret(intent.clientSecret);
                setStripeTotal(intent.totalAmount);
                setStripeOrderId(intent.orderId);
                setSelectedPayment('stripe');
            })
            .catch(error => {
                toast({ title: "Erro de Pagamento", description: error.message, variant: "destructive" });
                setSelectedPayment(null);
            })
            .finally(() => setIsLoading(false));
    }
  }

  const onDeliverySubmit = (data: DeliveryFormValues) => {
    setDeliveryInfo(data);
    setStep('payment');
  }

  const handlePaymentOnDelivery = async (details: { method: 'PIX' | 'Dinheiro', changeFor?: number }) => {
    if (!deliveryInfo) return;
    setStep('finalizing');
    setIsModalOpen(false);

    try {
      function generateOrderId() {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const numbers = Math.floor(1000 + Math.random() * 9000);
        return `${letter}${numbers}`;
      }
      const orderId = generateOrderId();
      
      const paymentDetails = details.method === 'Dinheiro'
        ? `Dinheiro (Troco para R$ ${details.changeFor?.toFixed(2)})`
        : 'PIX';

      const result = await saveOrder({
        items,
        totalAmount: totalWithFee,
        paymentMethod: 'on_delivery',
        paymentDetails,
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
      setStep('payment');
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
            const noPaymentMethods = !paymentSettings?.isLive && !paymentSettings?.isPaymentOnDeliveryEnabled;
            if(isLoading || !deliveryInfo) return <p>Carregando...</p>;

            if (selectedPayment === 'stripe') {
                return (
                    <div className="space-y-8">
                       <CartSummary />
                       <div className="border-t border-dashed pt-8">
                        {clientSecret && stripePromise && stripeOrderId ? (
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                                <StripeForm
                                deliveryInfo={deliveryInfo}
                                onSuccess={handleStripeSuccess}
                                onFinalizing={() => setStep('finalizing')}
                                totalAmount={stripeTotal}
                                orderId={stripeOrderId}
                                />
                            </Elements>
                        ) : <p>Carregando formulário de pagamento...</p>}
                       </div>
                        <Button variant="outline" onClick={() => setSelectedPayment(null)} className="w-full sm:w-auto">
                            Voltar para métodos de pagamento
                        </Button>
                    </div>
                )
            }
            
            return (
              <div className="space-y-8">
                    <div className="space-y-4">
                        {paymentSettings?.isLive && (
                           <button className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors" onClick={prepareStripePayment}>
                                <div className="flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-primary shrink-0"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                    <div>
                                        <span className="font-semibold text-lg">Cartão de Crédito</span>
                                        <p className="text-sm text-muted-foreground">Pagamento seguro via Stripe.</p>
                                    </div>
                                </div>
                            </button>
                        )}
                        {paymentSettings?.isPaymentOnDeliveryEnabled && (
                            <button className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors" onClick={() => setIsModalOpen(true)}>
                                <div className="flex items-center gap-4">
                                    <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary shrink-0" fill="currentColor">
                                      <text x="5" y="28" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold">R$</text>
                                    </svg>
                                    <div>
                                        <span className="font-semibold text-lg">Pagar na Entrega</span>
                                        <p className="text-sm text-muted-foreground">Pague com PIX ou dinheiro ao receber.</p>
                                    </div>
                                </div>
                            </button>
                        )}
                        {noPaymentMethods && (
                            <p className='text-center text-muted-foreground'>Nenhum método de pagamento habilitado.</p>
                        )}
                    </div>
                  <Button variant="outline" onClick={() => setStep('delivery')} className="w-full sm:w-auto">Voltar</Button>
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

  const shouldShowTitle = step !== 'finalizing' && !selectedPayment;

  return (
    <>
      <div className="container mx-auto px-4 pt-8 pb-24 max-w-2xl space-y-8">
        {shouldShowTitle && <h1 className="text-3xl font-bold text-center">{stepTitles[step]}</h1>}
        <div className="border rounded-lg p-6 sm:p-8">
          {renderContent()}
        </div>
      </div>
      {paymentSettings?.isPaymentOnDeliveryEnabled && (
          <PaymentOnDeliveryModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handlePaymentOnDelivery}
              totalAmount={totalWithFee}
              pixKey={paymentSettings.pixKey || ''}
          />
      )}
    </>
  );
}
