"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addHighlight } from "@/actions/highlight-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const highlightSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  link: z.string().url("O link (URL) é inválido."),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
}).superRefine((data, ctx) => {
  const { imageUrl, imageFile } = data;
  if (imageUrl && !z.string().url().safeParse(imageUrl).success) {
    ctx.addIssue({ code: z.ZodIssueCode.invalid_string, validation: "url", message: "A URL da imagem é inválida.", path: ["imageUrl"] });
  }
  if (!imageUrl && !imageFile) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "É necessário fornecer uma URL ou um arquivo de imagem.", path: ["imageUrl"] });
  }
});

type HighlightFormValues = z.infer<typeof highlightSchema>;

export default function NewHighlightPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<HighlightFormValues>({
    resolver: zodResolver(highlightSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: HighlightFormValues) => {
    try {
      let finalImageUrl = data.imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `highlights/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }
      
      if (!finalImageUrl) {
        throw new Error("URL da imagem não encontrada.");
      }

      const dataToSave = {
        title: data.title,
        description: data.description,
        link: data.link,
        imageUrl: finalImageUrl,
      };

      await addHighlight(dataToSave);
      
      toast({
        title: "Sucesso!",
        description: "O destaque foi cadastrado com sucesso.",
      });
      form.reset();
      router.push('/admin/highlights');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message || "Não foi possível cadastrar o destaque.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Cadastrar Destaque</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Novo Destaque</CardTitle>
          <CardDescription>Preencha os dados abaixo para adicionar um novo destaque.</CardDescription>
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
                      <Input placeholder="Ex: Promoção de Verão" {...field} />
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
                      <Textarea placeholder="Descontos imperdíveis em todas as bebidas!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://seusite.com/promocao" {...field} />
                    </FormControl>
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
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Destaque"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AdminLayout>
  );
} 