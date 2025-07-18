"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCategoryById, updateCategory } from "@/actions/category-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const categorySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const categoryId = params.id;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (categoryId) {
      getCategoryById(categoryId)
        .then((category) => {
          if (category && category.name) {
            form.reset({ name: category.name });
          }
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Erro!", description: "Categoria não encontrada ou falha ao carregar." });
          router.push('/admin/categories');
        });
    }
  }, [categoryId, form, router, toast]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      await updateCategory(categoryId, data);
      toast({
        title: "Sucesso!",
        description: "A categoria foi atualizada com sucesso.",
      });
      router.push('/admin/categories');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Não foi possível atualizar a categoria.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Editar Categoria</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editando Categoria</CardTitle>
          <CardDescription>Altere os dados abaixo para atualizar a categoria.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bebidas Quentes" {...field} />
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