
"use client";

import { useEffect, useState } from "react";
import { getItems } from "@/actions/item-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
}

export default function ItemsListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const fetchedItems = await getItems();
      setItems(fetchedItems);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Não foi possível carregar os itens.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);


  return (
    <AdminLayout>
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Itens do Cardápio</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button asChild size="sm" className="h-8 gap-1">
                    <Link href="/admin/items/new">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Cadastrar Item
                        </span>
                    </Link>
                </Button>
            </div>
        </div>
      <Card>
          <CardHeader>
              <CardTitle>Itens Cadastrados</CardTitle>
              <CardDescription>Lista de todos os itens existentes no cardápio.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <p>Carregando itens...</p>
             ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.description}</TableCell>
                        <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm">...</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Nenhum item encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
             )}
          </CardContent>
      </Card>
    </AdminLayout>
  );
}
