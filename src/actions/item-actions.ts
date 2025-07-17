
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
