'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp, doc, updateDoc, deleteDoc, getDoc, where } from 'firebase/firestore';

const highlightSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  imageUrl: z.string().url("A URL da imagem é inválida."),
  link: z.string().url("O link (URL) é inválido."),
  isActive: z.boolean().default(false),
});

export async function addHighlight(data: z.infer<typeof highlightSchema>) {
  const validation = highlightSchema.safeParse(data);

  if (!validation.success) {
    throw new Error('Dados do destaque inválidos.');
  }

  try {
    const docRef = await addDoc(collection(db, "highlights"), {
      ...validation.data,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...validation.data };
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error('Falha ao adicionar destaque no banco de dados.');
  }
}

export async function getHighlights() {
    try {
      const q = query(collection(db, "highlights"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const highlights = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const serializableData = {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            link: data.link || '',
            isActive: data.isActive || false,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
        return serializableData;
      });

      return highlights;
    } catch (e) {
        console.error("Error fetching documents: ", e);
        throw new Error('Falha ao buscar destaques.');
    }
} 

export async function getActiveHighlights() {
    try {
      const q = query(
        collection(db, "highlights"), 
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const highlights = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            link: data.link || '',
            isActive: data.isActive,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });

      return highlights;
    } catch (e) {
        console.error("Error fetching active highlights: ", e);
        // Retorna um array vazio em caso de erro para não quebrar o frontend
        return [];
    }
}

export async function getHighlightById(id: string) {
    if (!id) throw new Error('ID do destaque é obrigatório.');
    try {
        const docRef = doc(db, 'highlights', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const serializableData = Object.fromEntries(
                Object.entries(data).map(([key, value]) =>
                    value instanceof Timestamp ? [key, value.toDate().toISOString()] : [key, value]
                )
            );
            return { id: docSnap.id, ...serializableData };
        }
        throw new Error('Destaque não encontrado.');
    } catch (e) {
        console.error("Error fetching document: ", e);
        throw new Error('Falha ao buscar o destaque.');
    }
}

export async function updateHighlight(id: string, data: Partial<z.infer<typeof highlightSchema>>) {
    if (!id) throw new Error('ID do destaque é obrigatório.');
    
    // N.B: Using .partial() allows updating fields without validating all of them
    const validation = highlightSchema.partial().safeParse(data);
    if (!validation.success) throw new Error('Dados do destaque inválidos.');

    try {
        const highlightRef = doc(db, 'highlights', id);
        await updateDoc(highlightRef, validation.data);
        return { success: true };
    } catch (e) {
        console.error("Error updating document: ", e);
        throw new Error('Falha ao atualizar o destaque.');
    }
}

export async function deleteHighlight(id: string) {
    if (!id) throw new Error('ID do destaque é obrigatório.');
    try {
        const highlightRef = doc(db, 'highlights', id);
        await deleteDoc(highlightRef);
        return { success: true };
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error('Falha ao excluir o destaque.');
    }
} 