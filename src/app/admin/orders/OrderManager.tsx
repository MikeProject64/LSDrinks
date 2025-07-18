
"use client";

import { useState, useTransition } from "react";
import { getAllOrders, updateOrderStatus } from "@/actions/payment-actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { User, Phone, MapPin, ChevronDown } from "lucide-react";

type Order = Awaited<ReturnType<typeof getAllOrders>>[0];

const paymentStatusOptions = ['Pendente', 'Pago'] as const;
const orderStatusOptions = ['Aguardando', 'Confirmado', 'Enviado', 'Entregue'] as const;

const getPaymentStatusVariant = (status: string) => {
    switch (status) {
        case 'Pago': return 'default';
        case 'Pendente': return 'secondary';
        default: return 'outline';
    }
};

const getOrderStatusVariant = (status: string) => {
    switch (status) {
        case 'Aguardando': return 'secondary';
        case 'Confirmado': return 'outline';
        case 'Enviado': return 'default';
        case 'Entregue': return 'default';
        default: return 'outline';
    }
};


export default function OrderManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (orderId: string, type: 'paymentStatus' | 'orderStatus', value: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus({ orderId, [type]: value });
        toast({ title: "Sucesso", description: "Status do pedido atualizado." });
        // Refresh orders from server to ensure data consistency
        const updatedOrders = await getAllOrders();
        setOrders(updatedOrders);
      } catch (error) {
        const e = error as Error;
        toast({ variant: "destructive", title: "Erro", description: e.message });
      }
    });
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
          <Accordion type="multiple" className="w-full">
            {orders.map((order) => (
              <AccordionItem value={order.id} key={order.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="w-full grid grid-cols-2 sm:grid-cols-4 items-center text-sm font-normal gap-4">
                    <span className="font-mono font-semibold text-left">#{order.id}</span>
                    <span className="hidden sm:block text-left">{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
                    <div className="flex gap-2 items-center justify-start">
                         <Select
                            value={order.paymentStatus}
                            onValueChange={(value) => handleStatusChange(order.id, 'paymentStatus', value)}
                            disabled={isPending || order.paymentStatus === 'Pago'}
                            >
                            <SelectTrigger className="h-8 w-fit gap-1 text-xs font-semibold">
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
                            <SelectTrigger className="h-8 w-fit gap-1 text-xs">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {orderStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="font-medium text-right sm:pr-4">R$ {order.totalAmount.toFixed(2)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 bg-muted/50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-left">
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
    </Card>
  );
}
