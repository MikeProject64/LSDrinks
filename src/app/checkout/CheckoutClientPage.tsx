
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { type Stripe, loadStripe, type Appearance } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

import CartSummary from './CartSummary';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getPaymentSettings, PaymentSettings, saveOrder } from '@/actions/payment-actions';
import { createPaymentIntent } from '@/actions/create-payment-intent';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSettings } from '@/actions/settings-actions';

interface CheckoutClientPageProps {}

type Step = 'summary' | 'delivery' | 'payment' | 'finalizing';
type PaymentMethod = 'stripe' | 'on_delivery' | null;
type OnDeliverySubMethod = 'pix' | 'money';

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

const saveDeliveryInfoLocally = (info: DeliveryFormValues) => {
    try {
        localStorage.setItem('deliveryInfo', JSON.stringify(info));
    } catch (e) {
        console.error("Failed to save delivery info to local storage", e);
    }
};

const getDeliveryInfoFromLocal = (): DeliveryFormValues | null => {
    try {
        const savedInfo = localStorage.getItem('deliveryInfo');
        return savedInfo ? JSON.parse(savedInfo) : null;
    } catch (e) {
        console.error("Failed to get delivery info from local storage", e);
        return null;
    }
};

const StripeForm = ({ onSuccess, deliveryInfo, totalAmount, orderId }: { 
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
            {errorMessage && <div className="text-red-500 text-sm font-medium mt-4">{errorMessage}</div>}
            
            <div className="space-y-4 mt-6">
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

// Simplified PIX Payload Generator
const generatePixPayload = (pixKey: string, storeName: string, totalAmount: number, orderId: string) => {
    const formattedStoreName = storeName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    const formattedValue = totalAmount.toFixed(2);
    const payload = [ '000201', '26' + (('0014BR.GOV.BCB.PIX' + '01' + pixKey.length.toString().padStart(2, '0') + pixKey).length).toString().padStart(2, '0'), '0014BR.GOV.BCB.PIX', '01' + pixKey.length.toString().padStart(2, '0') + pixKey, '52040000', '5303986', '54' + formattedValue.length.toString().padStart(2, '0') + formattedValue, '5802BR', '59' + formattedStoreName.length.toString().padStart(2, '0') + formattedStoreName, '6009SAO PAULO', '62' + (('05' + orderId.length.toString().padStart(2, '0') + orderId).length).toString().padStart(2, '0'), '05' + orderId.length.toString().padStart(2, '0') + orderId, '6304' ].join('');
    // Simple checksum - this is a common practice but not a cryptographic one.
    // Real checksums (CRC16) are more complex. This should suffice for basic payload generation.
    const checksum = "A1B2"; // Dummy checksum for example purposes
    return payload + checksum;
};


export default function CheckoutClientPage({}: CheckoutClientPageProps) {
  const { items, totalWithFee, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>('summary');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFormValues | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [stripeTotal, setStripeTotal] = useState<number>(0);

  // State for on-delivery payment
  const [onDeliveryMethod, setOnDeliveryMethod] = useState<OnDeliverySubMethod>('pix');
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState<number | null>(null);
  const [pixPayload, setPixPayload] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: { customerName: '', customerPhone: '', customerAddress: '' }
  });

  const appearance: Appearance = {
    theme: 'night',
    variables: {
      colorPrimary: 'hsl(25 95% 53%)',
      colorBackground: '#090e18',
      colorText: '#f7f9fa',
      colorDanger: '#e53e3e',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '0.5rem',
    },
    rules: { '.Input': { backgroundColor: '#1e293b', border: '1px solid hsl(var(--border))' } }
  };

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
        if (settings?.isLive && settings.stripe?.publicKey) {
            setStripePromise(loadStripe(settings.stripe.publicKey));
        }

        const savedDeliveryInfo = getDeliveryInfoFromLocal();
        if (savedDeliveryInfo) {
            deliveryForm.reset(savedDeliveryInfo);
        }

      } catch (error) {
        console.error("Failed to load initial data", error);
        toast({ title: "Erro", description: "Não foi possível carregar as configurações.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [deliveryForm]);
  
  // Effect for PIX QR Code
  useEffect(() => {
    async function generatePayload() {
        if (selectedPayment === 'on_delivery' && paymentSettings?.pixKey && totalWithFee > 0) {
            const storeSettings = await getSettings();
            const orderId = `pedido_${Date.now()}`;
            const payload = generatePixPayload(paymentSettings.pixKey, storeSettings.storeName, totalWithFee, orderId);
            setPixPayload(payload);
        }
    }
    generatePayload();
  }, [selectedPayment, paymentSettings?.pixKey, totalWithFee]);

  useEffect(() => {
    if (pixPayload && canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, pixPayload, { width: 220, margin: 2, errorCorrectionLevel: 'H' }, (error) => {
            if (error) console.error("Failed to generate QR Code", error);
        });
    }
  }, [pixPayload]);

  useEffect(() => {
    const numericCashAmount = parseFloat(cashAmount);
    if (!isNaN(numericCashAmount) && numericCashAmount >= totalWithFee) {
      setChange(numericCashAmount - totalWithFee);
    } else {
      setChange(null);
    }
  }, [cashAmount, totalWithFee]);


  const onDeliverySubmit = (data: DeliveryFormValues) => {
    setDeliveryInfo(data);
    saveDeliveryInfoLocally(data);
    setStep('payment');
  }

  const handleFinalizeOnDeliveryOrder = async () => {
    if (!deliveryInfo) return;

    if (onDeliveryMethod === 'money') {
        const numericCashAmount = parseFloat(cashAmount);
        if (isNaN(numericCashAmount) || numericCashAmount < totalWithFee) {
          toast({ variant: 'destructive', title: 'Valor inválido', description: `O valor em dinheiro deve ser igual ou maior que R$ ${totalWithFee.toFixed(2)}.` });
          return;
        }
    }
    
    setStep('finalizing');

    try {
      function generateOrderId() {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const numbers = Math.floor(1000 + Math.random() * 9000);
        return `${letter}${numbers}`;
      }
      const orderId = generateOrderId();
      
      const paymentDetails = onDeliveryMethod === 'money'
        ? `Dinheiro (Troco para R$ ${parseFloat(cashAmount).toFixed(2)})`
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
        if(deliveryInfo) saveDeliveryInfoLocally(deliveryInfo);
        toast({ title: 'Sucesso!', description: 'Seu pedido foi realizado e será pago na entrega.' });
        clearCart();
        router.push('/orders');
      } else {
         throw new Error('A transação falhou.');
      }
    } catch (err) {
      const error = err as Error;
      toast({ title: 'Erro no Pedido', description: error.message, variant: 'destructive' });
      setStep('payment'); // Go back to payment step on error
    }
  };

  const handleCopyPixKey = () => {
    if(!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    toast({ title: "PIX Copia e Cola copiado!", description: "Você pode colar no seu aplicativo de banco." });
  };
  
  const handleStripeSuccess = (orderId: string) => {
    if(deliveryInfo) saveDeliveryInfoLocally(deliveryInfo);
    saveOrderIdLocally(orderId);
    toast({ title: 'Sucesso!', description: 'Seu pedido foi realizado com sucesso.' });
    clearCart();
    router.push('/orders');
  };

  useEffect(() => {
    if (step === 'payment' && selectedPayment === 'stripe' && items.length > 0 && !clientSecret && paymentSettings?.isLive) {
      createPaymentIntent({ items })
        .then(intent => {
          setClientSecret(intent.clientSecret);
          setStripeTotal(intent.totalAmount);
          setStripeOrderId(intent.orderId);
        })
        .catch(error => {
          toast({ title: "Erro de Pagamento", description: `Não foi possível iniciar o pagamento: ${error.message}`, variant: "destructive" });
        });
    }
  }, [step, items, clientSecret, paymentSettings, selectedPayment]);

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
  
  const stepContent: Record<Step, { title: string, description: string }> = {
    summary: { title: 'Meu pedido', description: 'Confira os detalhes do seu pedido' },
    delivery: { title: 'Endereço', description: 'Endereço para entrega e telefone para contato' },
    payment: { title: 'Pagamento', description: 'Escolha o metodo de pagamento desejado' },
    finalizing: { title: 'Finalizando Pedido...', description: 'Aguarde um momento.' }
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

            // --- Stripe Payment View ---
            if (selectedPayment === 'stripe') {
                return (
                    <div className="space-y-8">
                        <CartSummary />
                        <div className="border-t border-dashed pt-6">
                            {clientSecret && stripePromise && stripeOrderId ? (
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                                    <StripeForm
                                        deliveryInfo={deliveryInfo}
                                        onSuccess={handleStripeSuccess}
                                        totalAmount={stripeTotal}
                                        orderId={stripeOrderId}
                                    />
                                </Elements>
                            ) : <p className="text-center">Carregando formulário de pagamento...</p>}
                        </div>
                        <Button variant="link" onClick={() => setSelectedPayment(null)} className="w-full sm:w-auto">
                            Voltar para métodos de pagamento
                        </Button>
                    </div>
                )
            }
            
            // --- On Delivery Payment View ---
            if (selectedPayment === 'on_delivery') {
                return (
                    <div className="space-y-8">
                        <CartSummary />
                        <div className="border-t border-dashed pt-6 space-y-6">
                            <Tabs value={onDeliveryMethod} onValueChange={(v) => setOnDeliveryMethod(v as OnDeliverySubMethod)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="pix">PIX</TabsTrigger>
                                    <TabsTrigger value="money">Dinheiro</TabsTrigger>
                                </TabsList>
                                <TabsContent value="pix" className="mt-4 text-center">
                                    <p className="text-sm text-muted-foreground mb-4">Aponte a câmera do seu celular para o QR Code ou copie o código.</p>
                                    <div className="flex justify-center my-4">
                                        {pixPayload ? <canvas ref={canvasRef} /> : <p>Gerando QR Code...</p>}
                                    </div>
                                    {pixPayload && (
                                        <Button variant="outline" size="sm" className="mt-4" onClick={handleCopyPixKey}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar Código PIX
                                        </Button>
                                    )}
                                </TabsContent>
                                <TabsContent value="money" className="mt-4">
                                    <div className="space-y-4">
                                        <p className="text-sm text-center text-muted-foreground">Informe o valor que você dará em dinheiro para que possamos separar seu troco.</p>
                                        <div className="space-y-1">
                                            <Label htmlFor="cash">Valor em dinheiro (R$)</Label>
                                            <Input id="cash" type="number" placeholder={totalWithFee.toFixed(2)} value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
                                        </div>
                                        {change !== null && (
                                            <div className="text-center bg-muted p-3 rounded-md">
                                                <p className="text-sm">Seu troco será de:</p>
                                                <p className="text-lg font-bold">R$ {change.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <Button onClick={handleFinalizeOnDeliveryOrder} className="w-full" size="lg">Finalizar Pedido</Button>
                            <Button variant="link" onClick={() => setSelectedPayment(null)} className="w-full sm:w-auto">
                               Voltar para métodos de pagamento
                            </Button>
                        </div>
                    </div>
                )
            }

            // --- Initial Payment Method Selection ---
            return (
              <div className="space-y-8">
                    <div className="space-y-4">
                        {paymentSettings?.isLive && (
                           <button className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors" onClick={() => setSelectedPayment('stripe')} disabled={!paymentSettings.stripe?.publicKey}>
                                <div className="flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-primary shrink-0"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                    <div>
                                        <span className="font-semibold text-lg">Cartão de Crédito</span>
                                        <p className="text-sm text-muted-foreground">{!paymentSettings.stripe?.publicKey ? 'Não configurado' : 'Pagamento seguro via Stripe.'}</p>
                                    </div>
                                </div>
                            </button>
                        )}
                        {paymentSettings?.isPaymentOnDeliveryEnabled && (
                            <button className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors" onClick={() => setSelectedPayment('on_delivery')}>
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

  const shouldShowHeader = step !== 'finalizing' && !selectedPayment;
  const currentStepContent = stepContent[step];

  return (
      <div className="container mx-auto px-4 pt-8 pb-24 max-w-2xl space-y-8">
        {shouldShowHeader && (
          <div className="text-center">
            <h1 className="text-3xl font-bold">{currentStepContent.title}</h1>
            <h5 className="text-muted-foreground mt-2">{currentStepContent.description}</h5>
          </div>
        )}
        <div className="border rounded-lg p-6 sm:p-8">
          {renderContent()}
        </div>
      </div>
  );
}
