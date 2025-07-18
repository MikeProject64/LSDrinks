"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getHighlights, deleteHighlight, updateHighlight, swapHighlightPositions } from "@/actions/highlight-actions";
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
import { PlusCircle, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Highlight {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  position: number;
  [key: string]: any;
}

export default function HighlightsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchHighlights = async () => {
    setIsLoading(true);
    try {
      const fetchedHighlights = await getHighlights();
      setHighlights(fetchedHighlights as Highlight[]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Não foi possível carregar os destaques.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, []);

  const handleToggleActive = (highlight: Highlight) => {
    startTransition(async () => {
      try {
        await updateHighlight(highlight.id, { isActive: !highlight.isActive });
        toast({ title: "Sucesso!", description: `Destaque ${!highlight.isActive ? 'ativado' : 'desativado'}.` });
        fetchHighlights();
      } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível alterar o status do destaque." });
      }
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === highlights.length - 1)) {
        return;
    }
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    const highlight1 = highlights[index];
    const highlight2 = highlights[otherIndex];

    startTransition(async () => {
        try {
            await swapHighlightPositions(highlight1.id, highlight2.id);
            toast({ title: "Sucesso!", description: "Ordem dos destaques atualizada." });
            fetchHighlights();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Não foi possível reordenar os destaques." });
        }
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedHighlight) return;
    startTransition(async () => {
      try {
        await deleteHighlight(selectedHighlight.id);
        toast({ title: "Sucesso!", description: "Destaque excluído com sucesso." });
        setIsDeleteDialogOpen(false);
        setSelectedHighlight(null);
        fetchHighlights();
      } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível excluir o destaque." });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Destaques</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="h-8 gap-1">
            <Link href="/admin/highlights/new">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Cadastrar Destaque
              </span>
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Destaques Cadastrados</CardTitle>
          <CardDescription>Lista de todos os destaques existentes. Use as setas para reordenar.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando destaques...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ordem</TableHead>
                  <TableHead className="hidden w-[100px] sm:table-cell">Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Link</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highlights.length > 0 ? (
                  highlights.map((highlight, index) => (
                    <TableRow key={highlight.id}>
                      <TableCell className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0 || isPending}
                          className="h-8 w-8"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === highlights.length - 1 || isPending}
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {highlight.imageUrl ? (
                          <Image
                            alt={highlight.title}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={highlight.imageUrl}
                            width="64"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-xs text-gray-500">Sem Imagem</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{highlight.title}</TableCell>
                      <TableCell>
                        <Badge variant={highlight.isActive ? "default" : "outline"}>
                          {highlight.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs truncate max-w-[150px]">
                        {highlight.link || 'N/A'}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => handleToggleActive(highlight)} disabled={isPending}>
                              {highlight.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/admin/highlights/edit/${highlight.id}`)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedHighlight(highlight);
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
                    <TableCell colSpan={6} className="text-center">Nenhum destaque encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente o destaque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
