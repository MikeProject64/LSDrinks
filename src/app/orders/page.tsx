
'use client';

import { useEffect, useState } from 'react';
import { getOrdersByIds } from '@/actions/payment-actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { CartItem } from '@/types';
import { User, Phone, MapPin, Package, CreditCard } from "lucide-react";

interface Order {
    id: string;
    items: CartItem[];
    totalAmount: number;
    paymentStatus: 'Pendente' | 'Pago';
    orderStatus: 'Aguardando' | 'Confirmado' | 'Enviado' | 'Entregue';
    createdAt: string;
    paymentMethod: string;
    customer: {
        name: string;
        phone: string;
        address: string;
    }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const orderIdsString = localStorage.getItem('myOrderIds');
        if (orderIdsString) {
          const orderIds = JSON.parse(orderIdsString);
          if (orderIds.length > 0) {
            const fetchedOrders = await getOrdersByIds(orderIds);
            setOrders(fetchedOrders as Order[]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);
  
  const getPaymentStatusVariant = (status: string) => {
    return status === 'Pago' ? 'default' : 'secondary';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Meus Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Você ainda não fez nenhum pedido.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {orders.map((order) => (
                <AccordionItem value={order.id} key={order.id} className="border rounded-lg">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <div className="flex justify-between items-center w-full text-sm sm:text-base">
                      <span className="font-mono font-bold">#{order.id}</span>
                      <div className='flex items-center gap-2'>
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                        <Badge variant="outline">{order.orderStatus}</Badge>
                      </div>
                      <span className="font-bold whitespace-nowrap">R$ {order.totalAmount.toFixed(2)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 border-t">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                                <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={40}
                                        height={40}
                                        className="rounded-md object-cover"
                                        sizes="40px"
                                        />
                                        <div>
                                        <p className="font-semibold text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.quantity} x R$ {item.price.toFixed(2)}
                                        </p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-sm">
                                        R$ {(item.price * item.quantity).toFixed(2)}
                                    </p>
                                    </div>
                                ))}
                                </div>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Detalhes da Entrega</h4>
                                    <div className="space-y-2 text-sm">
                                        <p className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> {order.customer.name}</p>
                                        <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {order.customer.phone}</p>
                                        <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-1"/> {order.customer.address}</p>
                                    </div>
                                </div>
                                <div className="border-t"></div>
                                <div>
                                    <h4 className="font-semibold mb-2">Pagamento</h4>
                                    <p className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground"/>{order.paymentMethod}</p>
                                </div>
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
    </div>
  );
}

