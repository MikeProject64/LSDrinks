"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getHighlightById, updateHighlight } from "@/actions/highlight-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

const highlightSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  link: z.string().url("O link (URL) é inválido.").optional().or(z.literal('')),
  isActive: z.boolean().default(false),
  imageUrl: z.string().optional(),
});

type HighlightFormValues = z.infer<typeof highlightSchema>;

export default function EditHighlightPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const highlightId = params.id;
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<HighlightFormValues>({
    resolver: zodResolver(highlightSchema),
    defaultValues: {
        title: '',
        description: '',
        link: '',
        isActive: false,
    }
  });

  useEffect(() => {
    if (!highlightId) return;

    getHighlightById(highlightId).then(data => {
        if (data) {
            form.reset({
                title: data.title,
                description: data.description,
                link: data.link || '',
                isActive: data.isActive,
                imageUrl: data.imageUrl,
            });
            if (data.imageUrl) {
                setCurrentImageUrl(data.imageUrl as string);
            }
        }
    }).catch(() => {
        toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar o destaque." });
        router.push('/admin/highlights');
    });

  }, [highlightId, form, router, toast]);

  const onSubmit = async (data: HighlightFormValues) => {
    try {
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `highlights/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }
      
      const dataToSave = { ...data, imageUrl: finalImageUrl };
      if (!dataToSave.imageUrl) {
        throw new Error("A imagem é obrigatória.");
      }

      await updateHighlight(highlightId, dataToSave);
      
      toast({
        title: "Sucesso!",
        description: "O destaque foi atualizado com sucesso.",
      });
      router.push('/admin/highlights');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message || "Não foi possível atualizar o destaque.",
      });
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-lg font-semibold md:text-2xl">Editar Destaque</h1>
      <Card>
        <CardHeader>
          <CardTitle>Editando Destaque</CardTitle>
          <CardDescription>Altere os dados para atualizar o destaque.</CardDescription>
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
                      <Input placeholder="https://seusite.com/promocao (Opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativo</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {currentImageUrl && (
                <div>
                  <FormLabel>Imagem Atual</FormLabel>
                  <div className="mt-2">
                    <Image src={currentImageUrl} alt="Imagem atual" width={100} height={100} className="rounded-md object-cover" />
                  </div>
                </div>
              )}
               <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova URL da Imagem</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/imagem.jpg" 
                        {...field}
                        onChange={(e) => {
                            field.onChange(e);
                            setCurrentImageUrl(e.target.value); // Preview
                        }}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-center my-2 text-sm text-muted-foreground">OU</div>
              <FormItem>
                <FormLabel>Substituir Imagem</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const previewUrl = URL.createObjectURL(file);
                        setCurrentImageUrl(previewUrl);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AdminLayout>
  );
}
