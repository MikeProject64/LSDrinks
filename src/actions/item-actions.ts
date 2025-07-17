
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';

const itemSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  price: z.number().positive("O preço deve ser um número positivo."),
});

export async function addItem(data: { title: string; description: string; price: number }) {
  const validation = itemSchema.safeParse(data);

  if (!validation.success) {
    throw new Error('Dados do item inválidos.');
  }

  try {
    const docRef = await addDoc(collection(db, "items"), {
      ...validation.data,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...validation.data };
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error('Falha ao adicionar item no banco de dados.');
  }
}


export async function getItems() {
    try {
      const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Converte Timestamps para um formato serializável (string ISO) se existirem
        const serializableData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => 
                value instanceof Timestamp ? [key, value.toDate().toISOString()] : [key, value]
            )
        );
        items.push({ id: doc.id, ...serializableData });
      });
      return items;
    } catch (e) {
      console.error("Error fetching documents: ", e);
      throw new Error('Falha ao buscar itens.');
    }
  }
