'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, getDocs, orderBy, Timestamp, where, documentId, writeBatch } from 'firebase/firestore';
import Stripe from 'stripe';
import { CartItem } from '@/types';

// Usaremos um único documento para armazenar todas as configurações de pagamento.
const settingsId = 'payment';
const settingsCollection = 'settings';

const paymentSettingsSchema = z.object({
  isLive: z.boolean().default(false),
  stripe: z.object({
    publicKey: z.string().optional(),
    secretKey: z.string().optional(),
  }).optional(),
  isPaymentOnDeliveryEnabled: z.boolean().default(false),
});

export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;

export async function savePaymentSettings(data: PaymentSettings) {
  const validation = paymentSettingsSchema.safeParse(data);

  if (!validation.success) {
    console.error('Validation errors:', validation.error.flatten());
    throw new Error('Dados de configuração de pagamento inválidos.');
  }

  try {
    const settingsRef = doc(db, settingsCollection, settingsId);
    await setDoc(settingsRef, validation.data, { merge: true });
    return { success: true, data: validation.data };
  } catch (e) {
    console.error("Error saving payment settings: ", e);
    throw new Error('Falha ao salvar as configurações de pagamento.');
  }
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  try {
    const settingsRef = doc(db, settingsCollection, settingsId);
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      // Validar os dados do banco de dados com o nosso esquema
      const data = docSnap.data();
      const validation = paymentSettingsSchema.safeParse(data);
      if (validation.success) {
        return validation.data;
      } else {
         console.warn("Dados de pagamento no Firestore estão malformados:", validation.error.flatten());
         return null;
      }
    }
    return null; // Nenhuma configuração encontrada
  } catch (e) {
    console.error("Error fetching payment settings: ", e);
    throw new Error('Falha ao buscar as configurações de pagamento.');
  }
}

const checkoutSchema = z.object({
  items: z.array(z.any()),
  totalAmount: z.number(),
  paymentMethodId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerAddress: z.string(),
});

function generateOrderId() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  const numbers = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  return `${letter}${numbers}`;
}

export async function processCheckout(data: z.infer<typeof checkoutSchema>) {
  const validation = checkoutSchema.safeParse(data);
  if (!validation.success) {
    console.error(validation.error);
    throw new Error('Dados de checkout inválidos.');
  }

  const { items, totalAmount, paymentMethodId, customerName, customerPhone, customerAddress } = validation.data;

  const paymentSettings = await getPaymentSettings();
  const orderId = generateOrderId();

  const commonOrderData = {
    items,
    totalAmount,
    customer: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress
    },
    createdAt: serverTimestamp(),
  };

  // Caso: Pagamento na Entrega
  if (paymentMethodId === 'on_delivery') {
    if (!paymentSettings?.isPaymentOnDeliveryEnabled) {
      throw new Error('O método de pagamento na entrega não está habilitado.');
    }
    const orderData = {
      ...commonOrderData,
      id: orderId,
      status: 'Pendente',
      paymentMethod: 'Na Entrega',
    };
    await setDoc(doc(db, 'orders', orderId), orderData);
    return { success: true, orderId };
  }

  // Caso: Pagamento com Stripe
  if (!paymentSettings?.isLive || !paymentSettings.stripe?.secretKey) {
    throw new Error('O sistema de pagamento não está ativo ou configurado.');
  }

  const stripe = new Stripe(paymentSettings.stripe.secretKey);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'brl',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        orderId: orderId,
        customerName: customerName,
      }
    });

    if (paymentIntent.status === 'succeeded') {
      const orderData = {
        ...commonOrderData,
        id: orderId,
        status: 'Pago',
        paymentMethod: 'Cartão de Crédito',
        stripePaymentIntentId: paymentIntent.id,
      };
      await setDoc(doc(db, 'orders', orderId), orderData);
      return { success: true, orderId };
    } else {
       throw new Error('Falha no pagamento.');
    }

  } catch (err) {
    const error = err as Error;
    console.error('Stripe Error:', error);
    let errorMessage = 'Ocorreu um erro desconhecido.';
    if (error instanceof Stripe.errors.StripeCardError) {
      errorMessage = error.message;
    }
    throw new Error(`Falha no processamento do pagamento: ${errorMessage}`);
  }
}

export async function getAllOrders() {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        items: data.items as CartItem[],
        totalAmount: data.totalAmount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        customer: data.customer,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      };
    });

    return orders;
  } catch (e) {
    console.error("Error fetching orders: ", e);
    throw new Error('Falha ao buscar os pedidos.');
  }
}

export async function getOrdersByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }
  
    try {
      const orders: any[] = [];
      // Firestore 'in' query has a limit of 30 elements, so we batch the requests
      for (let i = 0; i < ids.length; i += 30) {
        const batchIds = ids.slice(i, i + 30);
        const q = query(collection(db, "orders"), where(documentId(), "in", batchIds));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            items: data.items as CartItem[],
            totalAmount: data.totalAmount,
            status: data.status,
            paymentMethod: data.paymentMethod,
            customer: data.customer,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
          });
        });
      }
      
      // Sort orders by creation date descending, as the batching might mess up the order
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
      return orders;
    } catch (e) {
      console.error("Error fetching orders by IDs: ", e);
      throw new Error('Falha ao buscar os pedidos.');
    }
  }