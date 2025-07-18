
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, getDocs, orderBy, Timestamp, where, documentId, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
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
  pixKey: z.string().optional(),
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
      const data = docSnap.data();
      const validation = paymentSettingsSchema.safeParse(data);
      if (validation.success) {
        return validation.data;
      } else {
         console.warn("Dados de pagamento no Firestore estão malformados:", validation.error.flatten());
         return null;
      }
    }
    return null; 
  } catch (e) {
    console.error("Error fetching payment settings: ", e);
    throw new Error('Falha ao buscar as configurações de pagamento.');
  }
}

const checkoutSchema = z.object({
  items: z.array(z.any()),
  totalAmount: z.number(),
  paymentMethod: z.enum(['on_delivery', 'stripe']),
  paymentDetails: z.string(), 
  customerName: z.string(),
  customerPhone: z.string(),
  customerAddress: z.string(),
  orderId: z.string(), // O ID do pedido agora é obrigatório
  stripePaymentIntentId: z.string().optional(),
});

export async function saveOrder(data: z.infer<typeof checkoutSchema>) {
  const validation = checkoutSchema.safeParse(data);
  if (!validation.success) {
    console.error('Validation Error:', validation.error);
    throw new Error('Dados de checkout inválidos.');
  }

  const { items, totalAmount, paymentMethod, paymentDetails, customerName, customerPhone, customerAddress, orderId, stripePaymentIntentId } = validation.data;

  const paymentSettings = await getPaymentSettings();
  
  if (paymentMethod === 'on_delivery' && !paymentSettings?.isPaymentOnDeliveryEnabled) {
    throw new Error('O método de pagamento na entrega não está habilitado.');
  }

  const orderData = {
    id: orderId,
    items,
    totalAmount,
    customer: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress
    },
    createdAt: serverTimestamp(),
    paymentMethod: paymentDetails,
    paymentStatus: paymentMethod === 'stripe' ? 'Pago' : 'Pgto. na entrega', // Atualizado aqui
    orderStatus: 'Aguardando', // Novo status do pedido
    ...(stripePaymentIntentId && { stripePaymentIntentId }),
  };

  try {
    await setDoc(doc(db, 'orders', orderId), orderData);
    return { success: true, orderId };
  } catch (e) {
    console.error("Error saving order: ", e);
    throw new Error('Falha ao salvar o pedido no banco de dados.');
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
        paymentStatus: data.paymentStatus || 'Pendente',
        orderStatus: data.orderStatus || 'Aguardando',
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
      // Firestore 'in' query supports up to 30 elements
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
            paymentStatus: data.paymentStatus || 'Pendente',
            orderStatus: data.orderStatus || 'Aguardando',
            paymentMethod: data.paymentMethod,
            customer: data.customer,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
          });
        });
      }
      
      // Sort by date client-side as fetching in batches may mess up the order
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
      return orders;
    } catch (e) {
      console.error("Error fetching orders by IDs: ", e);
      throw new Error('Falha ao buscar os pedidos.');
    }
  }

const updateStatusSchema = z.object({
  orderId: z.string(),
  paymentStatus: z.enum(['Pendente', 'Pago', 'Pgto. na entrega']).optional(),
  orderStatus: z.enum(['Aguardando', 'Confirmado', 'Enviado', 'Entregue']).optional(),
});

export async function updateOrderStatus(data: {
  orderId: string;
  paymentStatus?: 'Pendente' | 'Pago' | 'Pgto. na entrega';
  orderStatus?: 'Aguardando' | 'Confirmado' | 'Enviado' | 'Entregue';
}) {
  const validation = updateStatusSchema.safeParse(data);
  if (!validation.success) {
    console.error(validation.error);
    throw new Error("Dados de atualização de status inválidos.");
  }

  const { orderId, paymentStatus, orderStatus } = validation.data;
  const orderRef = doc(db, "orders", orderId);
  
  const updateData: { [key: string]: string } = {};
  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
  }
  if (orderStatus) {
    updateData.orderStatus = orderStatus;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("Nenhum status para atualizar.");
  }

  try {
    await updateDoc(orderRef, updateData);
    return { success: true, message: "Status do pedido atualizado com sucesso." };
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Falha ao atualizar o status do pedido.");
  }
}

export async function deleteOrder(orderId: string) {
    if (!orderId) {
      throw new Error('ID do pedido é obrigatório.');
    }
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      return { success: true };
    } catch (e) {
      console.error("Error deleting order: ", e);
      throw new Error('Falha ao excluir o pedido.');
    }
}

export async function bulkUpdateOrders(
    orderIds: string[],
    updates: {
      paymentStatus?: 'Pendente' | 'Pago' | 'Pgto. na entrega';
      orderStatus?: 'Aguardando' | 'Confirmado' | 'Enviado' | 'Entregue';
    }
  ) {
    if (!orderIds || orderIds.length === 0) {
      throw new Error('Nenhum ID de pedido fornecido.');
    }
    if (Object.keys(updates).length === 0) {
      throw new Error('Nenhuma atualização fornecida.');
    }
  
    const batch = writeBatch(db);
    orderIds.forEach(orderId => {
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, updates);
    });
  
    try {
      await batch.commit();
      return { success: true, message: 'Pedidos atualizados em massa com sucesso.' };
    } catch (e) {
      console.error("Error updating orders in batch: ", e);
      throw new Error('Falha ao atualizar os pedidos em massa.');
    }
}

export async function bulkDeleteOrders(orderIds: string[]) {
    if (!orderIds || orderIds.length === 0) {
      throw new Error('Nenhum ID de pedido fornecido.');
    }
  
    const batch = writeBatch(db);
    orderIds.forEach(orderId => {
      const orderRef = doc(db, 'orders', orderId);
      batch.delete(orderRef);
    });
  
    try {
      await batch.commit();
      return { success: true, message: 'Pedidos excluídos em massa com sucesso.' };
    } catch (e) {
      console.error("Error deleting orders in batch: ", e);
      throw new Error('Falha ao excluir os pedidos em massa.');
    }
}
