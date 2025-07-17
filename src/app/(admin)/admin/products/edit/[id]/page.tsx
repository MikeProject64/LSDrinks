'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductForm, { ProductFormValues } from '../../ProductForm';
import { useToast } from '@/hooks/use-toast';

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [initialData, setInitialData] = useState<ProductFormValues | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof id === 'string') {
      const fetchProduct = async () => {
        setLoading(true);
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInitialData(docSnap.data() as ProductFormValues);
        } else {
          toast({ variant: "destructive", title: "Produto não encontrado." });
          router.push('/admin/products');
        }
        setLoading(false);
      };
      fetchProduct();
    }
  }, [id, router, toast]);

  const handleSubmit = async (data: ProductFormValues) => {
    if (typeof id !== 'string') return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, data);
      toast({ title: "Produto atualizado com sucesso!" });
      router.push('/admin/products');
    } catch (error) {
      console.error("Erro ao atualizar produto: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar o produto.",
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Carregando dados do produto...</div>;
  }

  if (!initialData) {
    // Este caso é coberto pelo `useEffect`, mas é uma boa prática ter.
    return <div>Produto não encontrado.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Produto</h1>
      <ProductForm 
        onSubmit={handleSubmit} 
        initialData={initialData} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
};

export default EditProductPage; 