'use client';

import { useEffect, useState } from 'react';
import { getOrdersByIds } from '@/actions/payment-actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { CartItem } from '@/types';

interface Order {
    id: string;
    items: CartItem[];
    totalAmount: number;
    status: string;
    createdAt: string;
    paymentMethod: string;
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
            setOrders(fetchedOrders);
          }
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        // Opcional: mostrar um toast de erro para o usuário
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Meus Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Você ainda não fez nenhum pedido.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {orders.map((order) => (
                <AccordionItem value={order.id} key={order.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4 text-sm sm:text-base">
                      <span className="truncate">Pedido #{order.id.slice(0, 7)}...</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold whitespace-nowrap">R$ {order.totalAmount.toFixed(2)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                        <div className='flex justify-between text-sm mb-4'>
                            <p>Status: <span className='font-semibold'>{order.status}</span></p>
                            <p>Pagamento: <span className='font-semibold'>{order.paymentMethod}</span></p>
                        </div>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                            <div>
                              <p className="font-semibold">{item.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x R$ {item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <p className="font-medium">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
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
