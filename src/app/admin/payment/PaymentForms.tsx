'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPaymentSettings, savePaymentSettings, PaymentSettings } from '@/actions/payment-actions';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const stripeFormSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
});

const statusFormSchema = z.object({
    isLive: z.boolean(),
    isPaymentOnDeliveryEnabled: z.boolean(),
});

export default function PaymentForms() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const stripeForm = useForm({
    resolver: zodResolver(stripeFormSchema),
    defaultValues: { publicKey: '', secretKey: '' },
  });

  const statusForm = useForm({
      resolver: zodResolver(statusFormSchema),
      defaultValues: { isLive: false, isPaymentOnDeliveryEnabled: false }
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const currentSettings = await getPaymentSettings();
        if (currentSettings) {
          setSettings(currentSettings);
          stripeForm.reset({
            publicKey: currentSettings.stripe?.publicKey || '',
            secretKey: currentSettings.stripe?.secretKey || '',
          });
          statusForm.reset({
            isLive: currentSettings.isLive || false,
            isPaymentOnDeliveryEnabled: currentSettings.isPaymentOnDeliveryEnabled || false,
          });
        }
      } catch (error) {
        toast({ title: 'Erro', description: 'Não foi possível carregar as configurações.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [stripeForm, statusForm]);
  
  const handleStripeSubmit = async (values: z.infer<typeof stripeFormSchema>) => {
    try {
        const newSettings: PaymentSettings = {
            ...settings,
            isLive: settings?.isLive || false,
            isPaymentOnDeliveryEnabled: settings?.isPaymentOnDeliveryEnabled || false,
            stripe: values,
        };
      await savePaymentSettings(newSettings);
      toast({ title: 'Sucesso', description: 'Credenciais Stripe salvas.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as credenciais.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: Partial<PaymentSettings>) => {
    try {
        const newSettings: PaymentSettings = {
            isLive: settings?.isLive || false,
            isPaymentOnDeliveryEnabled: settings?.isPaymentOnDeliveryEnabled || false,
            ...settings,
            ...newStatus,
        };
      const result = await savePaymentSettings(newSettings);
      setSettings(result.data!);
      statusForm.reset(result.data!);
      toast({ title: 'Sucesso', description: 'Status do pagamento atualizado.' });
    } catch (error) {
        toast({ title: 'Erro', description: 'Não foi possível alterar o status.', variant: 'destructive'});
    }
  }
  
  if (isLoading) {
      return <p>Carregando configurações...</p>
  }

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="stripe">Stripe</TabsTrigger>
      </TabsList>
      <TabsContent value="status">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Métodos de Pagamento</CardTitle>
            <CardDescription>
              Ative ou desative os métodos de pagamento da sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...statusForm}>
                <form className="space-y-4">
                    <FormField
                        control={statusForm.control}
                        name="isLive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Pagamentos com Cartão (Stripe)</FormLabel>
                                    <FormDescription>
                                        Permitir que clientes realizem pagamentos via Stripe.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        handleStatusChange({ isLive: checked });
                                    }}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={statusForm.control}
                        name="isPaymentOnDeliveryEnabled"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Pagamento na Entrega</FormLabel>
                                    <FormDescription>
                                       Permitir que clientes paguem com PIX ou dinheiro na entrega.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        handleStatusChange({ isPaymentOnDeliveryEnabled: checked });
                                    }}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="stripe">
        <Card>
          <CardHeader>
            <CardTitle>Credenciais Stripe</CardTitle>
            <CardDescription>
              Insira suas chaves de API do Stripe. Essas chaves são armazenadas de forma segura e nunca são expostas no lado do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...stripeForm}>
                <form onSubmit={stripeForm.handleSubmit(handleStripeSubmit)} className="space-y-4">
                    <FormField
                    control={stripeForm.control}
                    name="publicKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Chave Publicável</FormLabel>
                        <FormControl>
                            <Input placeholder="pk_test_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={stripeForm.control}
                    name="secretKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Chave Secreta</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="sk_test_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={stripeForm.formState.isSubmitting}>
                        {stripeForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Credenciais'}
                    </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}