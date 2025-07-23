"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSettings, saveSettings, type StoreSettings } from '@/actions/settings-actions';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const settingsSchema = z.object({
  storeName: z.string().min(1, 'O nome da loja é obrigatório.'),
  deliveryFees: z.object({
    stripe: z.coerce.number().min(0, 'A taxa de entrega não pode ser negativa.'),
    on_delivery: z.coerce.number().min(0, 'A taxa de entrega não pode ser negativa.'),
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsForm() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      deliveryFees: { stripe: 0, on_delivery: 0 },
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const currentSettings = await getSettings();
        if (currentSettings) {
          form.reset(currentSettings);
        }
      } catch (error) {
        toast({ title: 'Erro', description: 'Não foi possível carregar as configurações.', variant: 'destructive' });
      }
    }
    loadSettings();
  }, [form]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await saveSettings(values);
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' });
      window.location.reload();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Gerais</CardTitle>
        <CardDescription>
          Atualize o nome da sua loja e as taxas de entrega por tipo de pagamento.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Loja</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Minha Loja de Bebidas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryFees.stripe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Entrega (Cartão/Stripe) R$</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="5.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryFees.on_delivery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Entrega (Pagamento na Entrega) R$</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="5.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
