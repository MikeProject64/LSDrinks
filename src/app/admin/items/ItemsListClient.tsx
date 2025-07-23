
"use client";

import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import { getAdminItems, deleteItem } from "@/actions/item-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ItemsListClientProps {
    initialItems: any[];
    initialLastVisibleId: string | null;
    initialHasMore: boolean;
    initialCategories: Category[];
}

export default function ItemsListClient({ initialItems, initialLastVisibleId, initialHasMore, initialCategories }: ItemsListClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>(initialItems);
  const [categories] = useState<Category[]>(initialCategories);

  const [isDeleting, startDeleteTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [lastVisibleId, setLastVisibleId] = useState<string | null>(initialLastVisibleId);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isInitialLoad = useRef(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerEntry = useIntersectionObserver(loadMoreRef, { threshold: 1.0 });

  const fetchItems = useCallback(async (options: { reset: boolean }) => {
    const { reset } = options;
    if (isLoadingMore || (isLoading && !reset)) return;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const currentLastVisibleId = reset ? null : lastVisibleId;

      const result = await getAdminItems({
        lastVisibleId: currentLastVisibleId,
        searchQuery: searchQuery || null,
        categoryId: selectedCategory || null,
        pageLimit: 15
      });
      
      setItems(prev => (reset ? result.items : [...prev, ...result.items]) as Item[]);
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
  }, [lastVisibleId, searchQuery, selectedCategory, toast, isLoading, isLoadingMore]);

  // Efeito para carregar mais itens ao rolar
  useEffect(() => {
    if (observerEntry?.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
      fetchItems({ reset: false });
    }
  }, [observerEntry?.isIntersecting, hasMore, isLoadingMore, isLoading, fetchItems]);
  
  // Efeito para buscar novamente ao mudar filtros
  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    const timer = setTimeout(() => {
        fetchItems({ reset: true });
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);


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
  
  const handleCategoryChange = (value: string) => {
    // "all" é o valor para limpar o filtro
    setSelectedCategory(value === 'all' ? '' : value);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Itens Cadastrados</CardTitle>
          <div className="flex justify-between items-center">
            <CardDescription>Gerencie, filtre e pesquise os itens do seu cardápio.</CardDescription>
            <div className="ml-auto flex items-center gap-2">
                <Button asChild size="sm" className="h-8 gap-1">
                    <Link href="/admin/items/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Cadastrar Item</span>
                    </Link>
                </Button>
            </div>
          </div>
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
            <Select onValueChange={handleCategoryChange} value={selectedCategory || 'all'}>
              <SelectTrigger className="sm:w-[180px]">
                 <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
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
    </>
  );
}
