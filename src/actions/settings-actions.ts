'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const settingsId = 'store';
const settingsCollection = 'settings';

const storeSettingsSchema = z.object({
  storeName: z.string().default('LSDrinks'),
  deliveryFee: z.number().default(5),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export async function saveSettings(data: StoreSettings) {
  const validation = storeSettingsSchema.safeParse(data);

  if (!validation.success) {
    console.error('Validation errors:', validation.error.flatten());
    throw new Error('Dados de configuração inválidos.');
  }

  try {
    const settingsRef = doc(db, settingsCollection, settingsId);
    await setDoc(settingsRef, validation.data, { merge: true });
    return { success: true, data: validation.data };
  } catch (e) {
    console.error("Error saving store settings: ", e);
    throw new Error('Falha ao salvar as configurações da loja.');
  }
}

export async function getSettings(): Promise<StoreSettings> {
  try {
    const settingsRef = doc(db, settingsCollection, settingsId);
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const validation = storeSettingsSchema.safeParse(data);
      if (validation.success) {
        return validation.data;
      } else {
         console.warn("Dados de configuração no Firestore estão malformados:", validation.error.flatten());
         // Retorna o padrão em caso de erro de validação
         return storeSettingsSchema.parse({});
      }
    }
    // Retorna o padrão se o documento não existir
    return storeSettingsSchema.parse({});
  } catch (e) {
    console.error("Error fetching store settings: ", e);
    // Retorna o padrão em caso de erro de fetch
    return storeSettingsSchema.parse({});
  }
}
