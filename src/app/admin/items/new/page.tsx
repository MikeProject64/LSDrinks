
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addItem } from "@/actions/item-actions";
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

const itemSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  price: z.coerce.number().positive("O preço deve ser um número positivo."),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
}).superRefine((data, ctx) => {
  const { imageUrl, imageFile } = data;
  
  if (imageUrl && !z.string().url().safeParse(imageUrl).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_string,
      validation: "url",
      message: "A URL da imagem é inválida.",
      path: ["imageUrl"],
    });
  }

  if (!imageUrl && !imageFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "É necessário fornecer uma URL ou um arquivo de imagem.",
      path: ["imageUrl"],
    });
  }
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface Category {
  id: string;
  name: string;
}

export default function NewItemPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro!",
          description: "Não foi possível carregar as categorias.",
        });
      }
    }
    fetchCategories();
  }, [toast]);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      categoryId: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: ItemFormValues) => {
    try {
      let finalImageUrl = data.imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `items/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }
      
      if (!finalImageUrl) {
        throw new Error("URL da imagem não encontrada.");
      }

      const dataToSave = {
        title: data.title,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        imageUrl: finalImageUrl,
      };

      await addItem(dataToSave);
      
      toast({
        title: "Sucesso!",
        description: "O item foi cadastrado com sucesso.",
      });
      form.reset();
      router.push('/admin/items');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message || "Não foi possível cadastrar o item.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Cadastrar Item</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Novo Item</CardTitle>
          <CardDescription>Preencha os dados abaixo para adicionar um novo item ao cardápio.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
                          <Select onValueChange={field.onChange} value={field.value} defaultValue="">
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
              <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arquivo da Imagem</FormLabel>
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
               <div className="text-center my-2">OU</div>
               <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Item"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AdminLayout>
  );
}
