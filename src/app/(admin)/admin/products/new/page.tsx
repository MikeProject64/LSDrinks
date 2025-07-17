'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductForm, { ProductFormValues } from '../ProductForm';
import { useToast } from '@/hooks/use-toast';

const NewProductPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), data);
      toast({ title: "Produto adicionado com sucesso!" });
      router.push('/admin/products');
    } catch (error) {
      console.error("Erro ao adicionar produto: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar o produto.",
        description: "Ocorreu um problema, por favor tente novamente.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Adicionar Novo Produto</h1>
      <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

export default NewProductPage; 