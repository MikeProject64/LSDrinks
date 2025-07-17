
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';

const categorySchema = z.object({
  name: z.string().min(2, "O nome da categoria deve ter pelo menos 2 caracteres."),
});

export async function addCategory(data: { name: string }) {
  const validation = categorySchema.safeParse(data);

  if (!validation.success) {
    throw new Error('Dados da categoria inválidos.');
  }

  try {
    const docRef = await addDoc(collection(db, "categories"), {
      ...validation.data,
      createdAt: serverTimestamp(),
    });
    // Retorna um objeto simples e serializável, sem o serverTimestamp
    return { id: docRef.id, name: validation.data.name };
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error('Falha ao adicionar categoria no banco de dados.');
  }
}

export async function getCategories() {
  try {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const categories: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Converte Timestamps para um formato serializável (string ISO) se existirem
      const serializableData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => 
              value instanceof Timestamp ? [key, value.toDate().toISOString()] : [key, value]
          )
      );
      categories.push({ id: doc.id, ...serializableData });
    });
    return categories;
  } catch (e) {
    console.error("Error fetching documents: ", e);
    throw new Error('Falha ao buscar categorias.');
  }
}
