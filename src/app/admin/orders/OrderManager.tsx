
"use client";

import { useState, useTransition, useEffect } from "react";
import { getAllOrders, updateOrderStatus, deleteOrder } from "@/actions/payment-actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { User, Phone, MapPin, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Order = Awaited<ReturnType<typeof getAllOrders>>[0];

const paymentStatusOptions = ['Pendente', 'Pago'] as const;
const orderStatusOptions = ['Aguardando', 'Confirmado', 'Enviado', 'Entregue'] as const;

// Componente para renderizar a data de forma segura no cliente e evitar hydration mismatch
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        // Formatação que só roda no cliente, após a hidratação.
        setFormattedDate(new Date(dateString).toLocaleString("pt-BR", {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }));
    }, [dateString]);

    if (!formattedDate) {
        return <Skeleton className="h-4 w-36" />;
    }

    return <span>{formattedDate}</span>;
}

export default function OrderManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleStatusChange = (orderId: string, type: 'paymentStatus' | 'orderStatus', value: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus({ orderId, [type]: value });
        toast({ title: "Sucesso", description: "Status do pedido atualizado." });
        const updatedOrders = await getAllOrders();
        setOrders(updatedOrders);
      } catch (error) {
        const e = error as Error;
        toast({ variant: "destructive", title: "Erro", description: e.message });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedOrder) return;
    startTransition(async () => {
        try {
            await deleteOrder(selectedOrder.id);
            toast({ title: "Sucesso!", description: "Pedido excluído com sucesso."});
            const updatedOrders = await getAllOrders();
            setOrders(updatedOrders);
        } catch (error) {
            const e = error as Error;
            toast({ variant: "destructive", title: "Erro!", description: e.message });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedOrder(null);
        }
    });
  };

  const getPaymentStatusVariant = (status: string) => status === 'Pago' ? 'default' : 'secondary';
  const getOrderStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (status) {
        case 'Aguardando': return 'secondary';
        case 'Confirmado': return 'outline';
        case 'Enviado': return 'default';
        case 'Entregue': return 'default';
        default: return 'outline';
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pedidos</CardTitle>
        <CardDescription>
          Visualize e gerencie todos os pedidos feitos na sua loja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-2">
            {orders.map((order) => (
              <AccordionItem value={order.id} key={order.id} className="border rounded-lg">
                <div className="flex items-center gap-4 p-4">
                   <AccordionTrigger className="flex-1 hover:no-underline p-0">
                      <div className="w-full grid grid-cols-3 md:grid-cols-4 items-center text-sm font-normal gap-4 text-left">
                        <span className="font-mono font-semibold truncate">#{order.id}</span>
                        <div className="hidden md:block">
                            <FormattedDate dateString={order.createdAt} />
                        </div>
                        <span className="font-medium text-left">R$ {order.totalAmount.toFixed(2)}</span>
                        <div className="hidden sm:flex gap-2 items-center justify-start">
                             <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                             <Badge variant={getOrderStatusVariant(order.orderStatus)}>{order.orderStatus}</Badge>
                        </div>
                      </div>
                   </AccordionTrigger>
                    
                    <div className="flex gap-2 items-center justify-start">
                         <Select
                            value={order.paymentStatus}
                            onValueChange={(value) => handleStatusChange(order.id, 'paymentStatus', value)}
                            disabled={isPending || order.paymentStatus === 'Pago'}
                            >
                            <SelectTrigger className="h-8 w-[110px] gap-1 text-xs font-semibold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={order.orderStatus}
                            onValueChange={(value) => handleStatusChange(order.id, 'orderStatus', value)}
                            disabled={isPending}
                            >
                            <SelectTrigger className="h-8 w-[110px] gap-1 text-xs">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {orderStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                    setSelectedOrder(order);
                                    setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                >
                                    Excluir Pedido
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <AccordionContent>
                  <div className="p-4 bg-muted/50 rounded-b-lg grid grid-cols-1 md:grid-cols-2 gap-6 border-t">
                    <div>
                      <h4 className="font-semibold mb-3">Dados do Cliente</h4>
                      {order.customer ? (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2"><User className="w-4 h-4"/> {order.customer.name}</p>
                          <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {order.customer.phone}</p>
                          <p className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {order.customer.address}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Dados do cliente não disponíveis.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Itens do Pedido ({order.items.reduce((acc, item) => acc + item.quantity, 0)})</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {order.items.map((item, index) => (
                          <div key={`${item.id}-${index}`} className="flex items-center gap-3 text-left">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="rounded-sm object-cover"
                              sizes="40px"
                            />
                            <div>
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x R$ {item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o pedido <span className="font-bold">#{selectedOrder?.id}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
