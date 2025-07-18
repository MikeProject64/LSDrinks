
"use client";

import { useState, useTransition, useEffect } from "react";
import { getAllOrders, updateOrderStatus, deleteOrder, bulkUpdateOrders, bulkDeleteOrders } from "@/actions/payment-actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { User, Phone, MapPin, MoreHorizontal, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

type Order = Awaited<ReturnType<typeof getAllOrders>>[0];
type PaymentStatus = 'Pendente' | 'Pago' | 'Pgto. na entrega';
type OrderStatus = 'Aguardando' | 'Confirmado' | 'Enviado' | 'Entregue';

const paymentStatusOptions: PaymentStatus[] = ['Pago', 'Pendente', 'Pgto. na entrega'];
const orderStatusOptions: OrderStatus[] = ['Aguardando', 'Confirmado', 'Enviado', 'Entregue'];

const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
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

export default function OrderManager({ initialOrders: initialOrdersProp }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrdersProp);
  const [isPending, startTransition] = useTransition();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: '', description: '', onConfirm: () => {} });
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAndSetOrders();
  }, []);

  const fetchAndSetOrders = async () => {
    setIsLoading(true);
    try {
      const updatedOrders = await getAllOrders();
      setOrders(updatedOrders);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao recarregar os pedidos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (orderId: string, type: 'paymentStatus' | 'orderStatus', value: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus({ orderId, [type]: value });
        toast({ title: "Sucesso", description: "Status do pedido atualizado." });
        fetchAndSetOrders();
      } catch (error) {
        const e = error as Error;
        toast({ variant: "destructive", title: "Erro", description: e.message });
      }
    });
  };

  const handleDelete = (order: Order) => {
    setAlertContent({
      title: 'Você tem certeza?',
      description: `Isso excluirá permanentemente o pedido #${order.id}.`,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteOrder(order.id);
            toast({ title: "Sucesso!", description: "Pedido excluído com sucesso."});
            fetchAndSetOrders();
          } catch (error) {
            const e = error as Error;
            toast({ variant: "destructive", title: "Erro!", description: e.message });
          } finally {
            setIsAlertOpen(false);
          }
        });
      }
    });
    setIsAlertOpen(true);
  };
  
  const handleBulkDelete = () => {
    setAlertContent({
      title: `Excluir ${selectedOrderIds.length} pedidos?`,
      description: 'Esta ação não pode ser desfeita e excluirá permanentemente os pedidos selecionados.',
      onConfirm: () => {
        startTransition(async () => {
          try {
            await bulkDeleteOrders(selectedOrderIds);
            toast({ title: "Sucesso!", description: `${selectedOrderIds.length} pedidos foram excluídos.` });
            setSelectedOrderIds([]);
            fetchAndSetOrders();
          } catch (error) {
            const e = error as Error;
            toast({ variant: "destructive", title: "Erro!", description: e.message });
          } finally {
            setIsAlertOpen(false);
          }
        });
      }
    });
    setIsAlertOpen(true);
  };
  
  const handleBulkStatusUpdate = (type: 'paymentStatus' | 'orderStatus', value: PaymentStatus | OrderStatus) => {
    setAlertContent({
      title: 'Atualizar Status em Massa?',
      description: `Você tem certeza que deseja alterar o ${type === 'paymentStatus' ? 'status de pagamento' : 'status do pedido'} para "${value}" em ${selectedOrderIds.length} pedidos?`,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await bulkUpdateOrders(selectedOrderIds, { [type]: value });
            toast({ title: "Sucesso!", description: 'Pedidos atualizados.' });
            setSelectedOrderIds([]);
            fetchAndSetOrders();
          } catch (error) {
            const e = error as Error;
            toast({ variant: "destructive", title: "Erro!", description: e.message });
          } finally {
            setIsAlertOpen(false);
          }
        });
      }
    });
    setIsAlertOpen(true);
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
        case 'Pago': return 'bg-green-600/80 text-white';
        case 'Pendente': return 'bg-amber-500/80 text-white';
        case 'Pgto. na entrega': return 'bg-amber-500/80 text-white';
        default: return 'secondary';
    }
  };

  const getOrderStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (status) {
        case 'Aguardando': return 'secondary';
        case 'Confirmado': return 'default';
        case 'Enviado': return 'default';
        case 'Entregue': return 'bg-green-600/80 text-white hover:bg-green-600/90';
        default: return 'outline';
    }
  };

  const isAllSelected = orders.length > 0 && selectedOrderIds.length === orders.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
            <CardDescription>Carregando pedidos...</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </CardContent>
      </Card>
    )
  }

  const gridClass = "grid items-center grid-cols-[auto_minmax(120px,1fr)_minmax(120px,2fr)_minmax(100px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)_auto] gap-x-4";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pedidos</CardTitle>
        <div className="flex justify-between items-center">
            <CardDescription>Visualize e gerencie todos os pedidos.</CardDescription>
            {selectedOrderIds.length > 0 && (
                <div className="flex items-center gap-2">
                     <span className="text-sm text-muted-foreground">{selectedOrderIds.length} selecionado(s)</span>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">Ações em Massa</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Status do Pagamento</DropdownMenuLabel>
                            {paymentStatusOptions.map(status => (
                                <DropdownMenuItem key={status} onClick={() => handleBulkStatusUpdate('paymentStatus', status)}>Marcar como {status}</DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                             <DropdownMenuLabel>Status do Pedido</DropdownMenuLabel>
                             {orderStatusOptions.map(status => (
                                <DropdownMenuItem key={status} onClick={() => handleBulkStatusUpdate('orderStatus', status)}>Marcar como {status}</DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={handleBulkDelete}>Excluir Selecionados</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</div>
        ) : (
          <Accordion type="multiple" className="w-full">
            <div className={`${gridClass} p-4 border-b font-semibold text-muted-foreground text-sm`}>
                <Checkbox 
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                        setSelectedOrderIds(checked ? orders.map(o => o.id) : []);
                    }}
                 />
                <div className="truncate">Pedido</div>
                <div className="truncate hidden md:block">Cliente</div>
                <div className="truncate">Valor</div>
                <div className="truncate">Pagamento</div>
                <div className="truncate">Status</div>
                <div className="truncate text-right">Ações</div>
            </div>
            {orders.map((order) => (
              <AccordionItem value={order.id} key={order.id} className="border-b">
                 <div className="w-full">
                    <div className={`${gridClass} p-4 text-sm`}>
                        <Checkbox
                            checked={selectedOrderIds.includes(order.id)}
                            onCheckedChange={(checked) => {
                                setSelectedOrderIds(
                                    checked ? [...selectedOrderIds, order.id] : selectedOrderIds.filter(id => id !== order.id)
                                )
                            }}
                        />
                        <AccordionTrigger className="p-0 hover:no-underline flex justify-start truncate">
                            <div className="flex flex-col text-left">
                                <span className="font-mono font-semibold">#{order.id}</span>
                                <div className="text-xs text-muted-foreground"><FormattedDate dateString={order.createdAt} /></div>
                            </div>
                        </AccordionTrigger>
                        <div className="truncate hidden md:block">{order.customer?.name || 'Não informado'}</div>
                        <span className="font-medium truncate">R$ {order.totalAmount.toFixed(2)}</span>
                        
                        <div>
                            <Badge className={getPaymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                        </div>
                        <div>
                            <Badge variant={getOrderStatusVariant(order.orderStatus)}>{order.orderStatus}</Badge>
                        </div>

                        <div className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="text-xs font-normal">Pagamento</DropdownMenuLabel>
                                        <Select value={order.paymentStatus} onValueChange={(value) => handleStatusChange(order.id, 'paymentStatus', value as PaymentStatus)}>
                                            <SelectTrigger className="mx-2 w-auto min-w-[130px] gap-1 text-xs h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {paymentStatusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </DropdownMenuGroup>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="text-xs font-normal mt-2">Status do Pedido</DropdownMenuLabel>
                                        <Select value={order.orderStatus} onValueChange={(value) => handleStatusChange(order.id, 'orderStatus', value as OrderStatus)}>
                                            <SelectTrigger className="mx-2 w-auto min-w-[130px] gap-1 text-xs h-8"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {orderStatusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDelete(order)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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
                            <Image src={item.imageUrl} alt={item.title} width={40} height={40} className="rounded-sm object-cover" sizes="40px"/>
                            <div>
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.quantity} x R$ {item.price.toFixed(2)}</p>
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
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={alertContent.onConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
