
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp, doc, getDoc, updateDoc, deleteDoc, limit, startAfter, where } from 'firebase/firestore';

const itemSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  price: z.number().positive("O preço deve ser um número positivo."),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  imageUrl: z.string().url("A URL da imagem é inválida."),
});

export async function addItem(data: z.infer<typeof itemSchema>) {
  if (!db) throw new Error("Firebase não inicializado.");
  const validation = itemSchema.safeParse(data);

  if (!validation.success) {
    throw new Error('Dados do item inválidos.');
  }

  try {
    const docRef = await addDoc(collection(db, "items"), {
      ...validation.data,
      createdAt: serverTimestamp(),
    });
    // Correção: Retorna apenas dados simples para evitar erro de serialização.
    return { id: docRef.id, ...validation.data };
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error('Falha ao adicionar item no banco de dados.');
  }
}

const getAdminItems = async ({ 
  pageLimit = 15, 
  lastVisibleId, 
  categoryId, 
  searchQuery 
}: { 
  pageLimit?: number; 
  lastVisibleId?: string | null; 
  categoryId?: string | null; 
  searchQuery?: string | null; 
}) => {
  if (!db) {
    console.warn("Firebase não inicializado, retornando resultado paginado vazio.");
    return { items: [], lastVisibleId: null, hasMore: false };
  }

  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categories = new Map(categoriesSnapshot.docs.map(doc => [doc.id, doc.data().name]));

    let q = query(
      collection(db, "items"),
      orderBy("createdAt", "desc")
    );
    
    // Se há uma busca de texto, não podemos usar o cursor do Firestore (`startAfter`)
    // porque o filtro será feito em memória. Neste caso, buscamos todos os itens
    // que correspondem à categoria e depois filtramos e paginamos manualmente.
    if (searchQuery) {
        if (categoryId) {
            q = query(collection(db, "items"), where("categoryId", "==", categoryId), orderBy("createdAt", "desc"));
        }

        const allDocsSnapshot = await getDocs(q);
        let allItems = allDocsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                price: data.price || 0,
                imageUrl: data.imageUrl || '',
                categoryId: data.categoryId || '',
                categoryName: categories.get(data.categoryId) || 'Sem categoria',
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            };
        });

        const filteredItems = allItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

        // Paginação manual
        const startIndex = lastVisibleId ? filteredItems.findIndex(item => item.id === lastVisibleId) + 1 : 0;
        const paginatedItems = filteredItems.slice(startIndex, startIndex + pageLimit);
        
        const newLastVisibleId = paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].id : null;
        const hasMore = (startIndex + paginatedItems.length) < filteredItems.length;

        return { items: paginatedItems, lastVisibleId: newLastVisibleId, hasMore };

    } else {
        // Lógica sem busca por texto (com paginação do Firestore)
        let constraints = [orderBy("createdAt", "desc")];
        if (categoryId) {
            constraints.push(where("categoryId", "==", categoryId));
        }

        if (lastVisibleId) {
            const lastVisibleDoc = await getDoc(doc(db, "items", lastVisibleId));
            if (lastVisibleDoc.exists()) {
                constraints.push(startAfter(lastVisibleDoc));
            }
        }
        constraints.push(limit(pageLimit));
        
        const itemsQuery = query(collection(db, "items"), ...constraints);
        const itemsSnapshot = await getDocs(itemsQuery);
        
        const items = itemsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                price: data.price || 0,
                imageUrl: data.imageUrl || '',
                categoryId: data.categoryId || '',
                categoryName: categories.get(data.categoryId) || 'Sem categoria',
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            };
        });
        
        const newLastVisibleId = itemsSnapshot.docs.length > 0 ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1].id : null;
        const hasMore = items.length === pageLimit;

        return { items, lastVisibleId: newLastVisibleId, hasMore };
    }

  } catch (e) {
    console.error("Error fetching admin items: ", e);
    throw new Error('Falha ao buscar itens para o admin.');
  }
};

export { getAdminItems };


export async function getItems() {
  if (!db) {
    console.warn("Firebase não inicializado, retornando itens vazios.");
    return [];
  }
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categories = new Map(categoriesSnapshot.docs.map(doc => [doc.id, doc.data().name]));

    const itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const itemsSnapshot = await getDocs(itemsQuery);
    
    const items = itemsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Converte Timestamps e garante a estrutura correta
      const itemData = {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        price: data.price || 0,
        imageUrl: data.imageUrl || '',
        categoryId: data.categoryId || '',
        categoryName: categories.get(data.categoryId) || 'Sem categoria',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      };

      return itemData;
    });

    return items;
  } catch (e) {
    console.error("Error fetching documents: ", e);
    throw new Error('Falha ao buscar itens.');
  }
}

export async function getItemsPaginated({ pageLimit = 12, lastVisibleId }: { pageLimit?: number, lastVisibleId?: string | null }) {
  if (!db) {
    console.warn("Firebase não inicializado, retornando resultado paginado vazio.");
    return { items: [], lastVisibleId: null, hasMore: false };
  }
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categories = new Map(categoriesSnapshot.docs.map(doc => [doc.id, doc.data().name]));

    let itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"), limit(pageLimit));

    if (lastVisibleId) {
      const lastVisibleDoc = await getDoc(doc(db, "items", lastVisibleId));
      if (lastVisibleDoc.exists()) {
        itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"), startAfter(lastVisibleDoc), limit(pageLimit));
      }
    }
    
    const itemsSnapshot = await getDocs(itemsQuery);
    
    const items = itemsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        price: data.price || 0,
        imageUrl: data.imageUrl || '',
        categoryId: data.categoryId || '',
        categoryName: categories.get(data.categoryId) || 'Sem categoria',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      };
    });
    
    const newLastVisibleId = itemsSnapshot.docs.length > 0 ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1].id : null;
    const hasMore = items.length === pageLimit;

    return { items, lastVisibleId: newLastVisibleId, hasMore };

  } catch (e) {
    console.error("Error fetching paginated documents: ", e);
    throw new Error('Falha ao buscar itens paginados.');
  }
}

export async function getItemById(id: string) {
    if (!db) throw new Error("Firebase não inicializado.");
    if (!id) throw new Error('ID do item é obrigatório.');
    try {
        const itemRef = doc(db, 'items', id);
        const docSnap = await getDoc(itemRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
            };
        }
        throw new Error('Item não encontrado.');
    } catch (e) {
        console.error("Error fetching document: ", e);
        throw new Error('Falha ao buscar o item.');
    }
}

export async function updateItem(id: string, data: z.infer<typeof itemSchema>) {
    if (!db) throw new Error("Firebase não inicializado.");
    if (!id) throw new Error('ID do item é obrigatório.');
    const validation = itemSchema.safeParse(data);
    if (!validation.success) throw new Error('Dados do item inválidos.');

    try {
        const itemRef = doc(db, 'items', id);
        await updateDoc(itemRef, validation.data);
        return { success: true };
    } catch (e) {
        console.error("Error updating document: ", e);
        throw new Error('Falha ao atualizar o item.');
    }
}

export async function deleteItem(id: string) {
    if (!db) throw new Error("Firebase não inicializado.");
    if (!id) throw new Error('ID do item é obrigatório.');
    try {
        const itemRef = doc(db, 'items', id);
        await deleteDoc(itemRef);
        return { success: true };
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error('Falha ao excluir o item.');
    }
}

    