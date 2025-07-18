"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getItemById, updateItem } from "@/actions/item-actions";
import { getCategories } from "@/actions/category-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

const itemSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  price: z.coerce.number().positive("O preço deve ser um número positivo."),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
}).superRefine((data, ctx) => {
    // A validação de imagem/URL só é necessária se não houver já uma imageUrl
    // Esta lógica é simplificada, assumindo que a edição pode não exigir nova imagem
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface Category {
  id: string;
  name: string;
}

export default function EditItemPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const itemId = params.id;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (!itemId) return;

    // Fetch categories
    getCategories().then(setCategories).catch(() => {
        toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar categorias." });
    });

    // Fetch item data
    getItemById(itemId).then(itemData => {
        if (itemData) {
            form.reset(itemData);
            if (itemData.imageUrl) {
                setCurrentImageUrl(itemData.imageUrl);
            }
        }
    }).catch(() => {
        toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar o item." });
        router.push('/admin/items');
    });

  }, [itemId, form, router, toast]);

  const onSubmit = async (data: ItemFormValues) => {
    try {
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `items/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }
      
      if (!finalImageUrl) {
        throw new Error("A imagem é obrigatória.");
      }
      
      const dataToSave = {
          ...data,
          imageUrl: finalImageUrl,
      };

      await updateItem(itemId, dataToSave);
      
      toast({
        title: "Sucesso!",
        description: "O item foi atualizado com sucesso.",
      });
      router.push('/admin/items');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message || "Não foi possível atualizar o item.",
      });
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-lg font-semibold md:text-2xl">Editar Item</h1>
      <Card>
        <CardHeader>
          <CardTitle>Editando Item</CardTitle>
          <CardDescription>Altere os dados para atualizar o item.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Fields: title, description, price, categoryId */}
               <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Elixir Cósmico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Uma bebida brilhante e doce que tem gosto de galáxia." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="12.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                          {category.name}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )}
              />

              {currentImageUrl && (
                <div className="space-y-2">
                    <FormLabel>Imagem Atual</FormLabel>
                    <Image src={currentImageUrl} alt="Imagem atual do item" width={100} height={100} className="rounded-md" />
                </div>
              )}

              <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Substituir Imagem (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            field.onChange(file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ou use uma nova URL de Imagem (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.jpg" {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          setCurrentImageUrl(e.target.value);
                        }}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AdminLayout>
  );
} 