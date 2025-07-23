
"use client";

import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import { getAdminItems, deleteItem } from "@/actions/item-actions";
import { getCategories } from "@/actions/category-actions";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryName: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ItemsListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerEntry = useIntersectionObserver(loadMoreRef, { threshold: 1.0 });

  const fetchItems = useCallback(async (reset = false) => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    if(reset) setIsLoading(true);

    try {
      const result = await getAdminItems({
        lastVisibleId: reset ? null : lastVisibleId,
        searchQuery: searchQuery || null,
        categoryId: selectedCategory || null,
      });
      setItems(prev => reset ? result.items as Item[] : [...prev, ...result.items as Item[]]);
      setLastVisibleId(result.lastVisibleId);
      setHasMore(result.hasMore);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Não foi possível carregar os itens.",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [lastVisibleId, searchQuery, selectedCategory, toast, isLoadingMore]);

  useEffect(() => {
    if (observerEntry?.isIntersecting && hasMore && !isLoadingMore) {
      fetchItems();
    }
  }, [observerEntry, hasMore, isLoadingMore, fetchItems]);
  
  useEffect(() => {
    fetchItems(true);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleDeleteConfirm = () => {
    if (!selectedItem) return;

    startDeleteTransition(async () => {
      try {
        await deleteItem(selectedItem.id);
        toast({ title: "Sucesso!", description: "Item excluído com sucesso." });
        setItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
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
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Cadastrar Item</span>
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Itens Cadastrados</CardTitle>
          <CardDescription>Gerencie, filtre e pesquise os itens do seu cardápio.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por título..."
                className="pl-8 sm:w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
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
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">Sem Imagem</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.categoryName}</Badge>
                        </TableCell>
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
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhum item encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div ref={loadMoreRef} className="h-10 mt-4 flex justify-center items-center">
            {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            {!hasMore && items.length > 0 && <p className="text-sm text-muted-foreground">Fim da lista.</p>}
          </div>
        </CardContent>
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
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
