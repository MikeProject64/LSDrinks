
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPaymentSettings, savePaymentSettings, PaymentSettings } from '@/actions/payment-actions';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const paymentFormSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  pixKey: z.string().optional(),
  isLive: z.boolean(),
  isPaymentOnDeliveryEnabled: z.boolean(),
});

export default function PaymentForms() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      publicKey: '',
      secretKey: '',
      pixKey: '',
      isLive: false,
      isPaymentOnDeliveryEnabled: false,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const currentSettings = await getPaymentSettings();
        if (currentSettings) {
          setSettings(currentSettings);
          form.reset({
            publicKey: currentSettings.stripe?.publicKey || '',
            secretKey: currentSettings.stripe?.secretKey || '',
            pixKey: currentSettings.pixKey || '',
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
  }, [form]);
  
  const handleSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    try {
        const newSettings: PaymentSettings = {
            isLive: values.isLive,
            isPaymentOnDeliveryEnabled: values.isPaymentOnDeliveryEnabled,
            pixKey: values.pixKey,
            stripe: {
              publicKey: values.publicKey,
              secretKey: values.secretKey,
            },
        };
      await savePaymentSettings(newSettings);
      toast({ title: 'Sucesso', description: 'Configurações de pagamento salvas.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    }
  };

  if (isLoading) {
      return <p>Carregando configurações...</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pagamentos</CardTitle>
            <CardDescription>
              Ative ou desative os métodos de pagamento da sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
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
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
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
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credenciais e Chaves</CardTitle>
            <CardDescription>
              Configure suas chaves de API para processar pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe - Chave Publicável</FormLabel>
                  <FormControl>
                    <Input placeholder="pk_test_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe - Chave Secreta</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="sk_test_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pixKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX</FormLabel>
                  <FormControl>
                    <Input placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" {...field} />
                  </FormControl>
                  <FormDescription>
                    Esta chave será exibida para o cliente ao escolher pagar com PIX.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </form>
    </Form>
  );
}
