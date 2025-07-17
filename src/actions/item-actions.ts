
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';

const itemSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
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
    return { id: docRef.id };
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
        items.push({ id: doc.id, ...doc.data() });
      });
      return items;
    } catch (e) {
      console.error("Error fetching documents: ", e);
      throw new Error('Falha ao buscar itens.');
    }
  }
