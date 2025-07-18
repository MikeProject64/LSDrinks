
'use server';

import { z } from 'zod';
import Stripe from 'stripe';
import { getPaymentSettings } from './payment-actions';
import { getSettings } from './settings-actions';
import { CartItem } from '@/types';

const intentSchema = z.object({
  items: z.array(z.any()),
});

// A função agora retorna o orderId gerado para ser usado no metadata do Stripe
// e para salvar o pedido no banco de dados posteriormente.
export async function createPaymentIntent(data: { items: CartItem[] }): Promise<{ clientSecret: string; totalAmount: number; orderId: string; }> {
    const validation = intentSchema.safeParse(data);
    if (!validation.success) {
      throw new Error('Dados do carrinho inválidos.');
    }

    const { items } = validation.data;
    if (!items || items.length === 0) {
        throw new Error("O carrinho está vazio.");
    }
  
    const paymentSettings = await getPaymentSettings();
    const storeSettings = await getSettings();

    if (!paymentSettings?.isLive || !paymentSettings.stripe?.secretKey) {
      throw new Error('O sistema de pagamento não está ativo ou configurado.');
    }

    const stripe = new Stripe(paymentSettings.stripe.secretKey);
    
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = subtotal + (storeSettings.deliveryFee || 0);
    const amountInCents = Math.round(totalAmount * 100);

    // Gera um ID de pedido único ANTES de criar o PaymentIntent
    function generateOrderId() {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const numbers = Math.floor(1000 + Math.random() * 9000);
      return `${letter}${numbers}`;
    }
    const orderId = generateOrderId();
  
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
            orderId: orderId, // Anexa o ID do pedido ao PaymentIntent
        }
      });
      
      if (!paymentIntent.client_secret) {
        throw new Error('Falha ao gerar o segredo do cliente do PaymentIntent.');
      }

      // Retorna tudo que o frontend precisa
      return { clientSecret: paymentIntent.client_secret, totalAmount, orderId };

    } catch (err) {
      const error = err as Error;
      console.error('Stripe Error:', error.message);
      throw new Error(`Falha ao criar a intenção de pagamento: ${error.message}`);
    }
}
