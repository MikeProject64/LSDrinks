
"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { getItemsPaginated, deleteItem } from "@/actions/item-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";


interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryName: string;
}

const ITEMS_PER_PAGE = 10;

export default function ItemsListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();

  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<(string | null)[]>([null]);


  const fetchItems = async (direction: 'next' | 'prev' | 'current' = 'current') => {
    setIsLoading(true);
    try {
        let lastId = lastVisibleId;
        if (direction === 'next') {
            // we already have the lastVisibleId for the next page
        } else if (direction === 'prev') {
            // The last item of the *previous* page is what we need for `startAfter`
            lastId = page > 2 ? pageHistory[page - 2] : null;
        }

      const result = await getItemsPaginated({ pageLimit: ITEMS_PER_PAGE, lastVisibleId: lastId });
      
      setItems(result.items as Item[]);
      setHasMore(result.hasMore);

      if (direction === 'next') {
        setLastVisibleId(result.lastVisibleId);
        // Only add to history if we are moving to a new page not already in history
        if (page + 1 > pageHistory.length) {
            setPageHistory([...pageHistory, result.lastVisibleId]);
        }
        setPage(p => p + 1);
      } else if (direction === 'prev') {
        setPage(p => Math.max(1, p - 1));
        // The last visible id for the new current page is the one we just fetched to get here
        setLastVisibleId(lastId);
      }

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
    fetchItems('current');
  }, []);

  const handleDeleteConfirm = () => {
    if (!selectedItem) return;

    startTransition(async () => {
      try {
        await deleteItem(selectedItem.id);
        toast({ title: "Sucesso!", description: "Item excluído com sucesso." });
        fetchItems('current'); // Refresh list
      } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível excluir o item." });
      } finally {
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      }
    });
  };

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
                    <TableHead className="hidden w-[100px] sm:table-cell">Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="hidden sm:table-cell">
                          {item.imageUrl ? (
                            <Image
                              alt={item.title}
                              className="aspect-square rounded-md object-cover"
                              height="64"
                              src={item.imageUrl}
                              width="64"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-500">Sem Imagem</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.categoryName}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{item.description}</TableCell>
                        <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/admin/items/edit/${item.id}`)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Nenhum item encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
             )}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
                Página <strong>{page}</strong>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchItems('prev')} disabled={page <= 1 || isLoading}>
                    Anterior
                </Button>
                <Button size="sm" variant="outline" onClick={() => fetchItems('next')} disabled={!hasMore || isLoading}>
                    Próximo
                </Button>
            </div>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o item
              <span className="font-bold"> {selectedItem?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending}>
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
