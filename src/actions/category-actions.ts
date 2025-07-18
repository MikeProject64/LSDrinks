
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';

const categorySchema = z.object({
  name: z.string().min(2, "O nome da categoria deve ter pelo menos 2 caracteres."),
});

export async function addCategory(data: { name: string }) {
  if (!db) throw new Error("Firebase não inicializado.");
  const validation = categorySchema.safeParse(data);

  if (!validation.success) {
    throw new Error('Dados da categoria inválidos.');
  }

  try {
    const docRef = await addDoc(collection(db, "categories"), {
      ...validation.data,
      createdAt: serverTimestamp(),
    });

    // Correção Definitiva: Retorna um objeto simples e seguro.
    // A página de categorias recarregará a lista de qualquer maneira,
    // e essa abordagem evita erros de serialização com o serverTimestamp().
    return {
      id: docRef.id,
      name: validation.data.name,
    };

  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error('Falha ao adicionar categoria no banco de dados.');
  }
}

export async function getCategories() {
    if (!db) {
        console.warn("Firebase não inicializado, retornando categorias vazias.");
        return [];
    }
    try {
      const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const categories: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Correção Definitiva: Garante que qualquer campo Timestamp seja convertido
        // para uma string ISO, que é um formato seguro para serialização.
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

export async function deleteCategory(id: string) {
    if (!db) throw new Error("Firebase não inicializado.");
    if (!id) {
        throw new Error('ID da categoria é obrigatório.');
    }
    try {
        const categoryRef = doc(db, 'categories', id);
        await deleteDoc(categoryRef);
        return { success: true };
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error('Falha ao excluir a categoria.');
    }
}

export async function getCategoryById(id: string) {
    if (!db) throw new Error("Firebase não inicializado.");
    if (!id) {
        throw new Error('ID da categoria é obrigatório.');
    }
    try {
        const categoryRef = doc(db, 'categories', id);
        const docSnap = await getDoc(categoryRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const serializableData = Object.fromEntries(
                Object.entries(data).map(([key, value]) =>
                    value instanceof Timestamp ? [key, value.toDate().toISOString()] : [key, value]
                )
            );
            return { id: docSnap.id, ...serializableData };
        } else {
            throw new Error('Categoria não encontrada.');
        }
    } catch (e) {
        console.error("Error fetching document: ", e);
        throw new Error('Falha ao buscar a categoria.');
    }
}

export async function updateCategory(id: string, data: { name: string }) {
    if (!db) throw new Error("Firebase não inicializado.");
    if (!id) {
        throw new Error('ID da categoria é obrigatório.');
    }
    const validation = categorySchema.safeParse(data);

    if (!validation.success) {
        throw new Error('Dados da categoria inválidos.');
    }

    try {
        const categoryRef = doc(db, 'categories', id);
        await updateDoc(categoryRef, validation.data);
        return { success: true };
    } catch (e) {
        console.error("Error updating document: ", e);
        throw new Error('Falha ao atualizar a categoria.');
    }
}
