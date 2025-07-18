
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { CartItem } from '@/types';
import { User, Phone, MapPin, CreditCard, Calendar } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Order {
    id: string;
    items: CartItem[];
    totalAmount: number;
    paymentStatus: 'Pendente' | 'Pago' | 'Pgto. na entrega';
    orderStatus: 'Aguardando' | 'Confirmado' | 'Enviado' | 'Entregue';
    createdAt: string;
    paymentMethod: string;
    customer: {
        name: string;
        phone: string;
        address: string;
    }
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        setFormattedDate(new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }));
    }, [dateString]);

    return <span>{formattedDate}</span>;
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
        case 'Confirmado': return 'outline';
        case 'Enviado': return 'default';
        case 'Entregue': return 'default';
        default: return 'outline';
    }
  };

  const OrderSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
             <div key={i} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/5" />
                    <Skeleton className="h-6 w-1/6" />
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Meus Pedidos</CardTitle>
          <CardDescription>Acompanhe o status dos seus pedidos recentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <OrderSkeleton />
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido.</p>
                <Button asChild>
                    <Link href="/">Ver cardápio</Link>
                </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {orders.map((order) => (
                <AccordionItem value={order.id} key={order.id} className="border rounded-lg bg-card">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 text-left">
                        <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-lg sm:text-base">Pedido #{order.id}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3 h-3"/>
                                <FormattedDate dateString={order.createdAt} />
                            </span>
                        </div>
                      <div className='flex items-center gap-2'>
                        <Badge className={getPaymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                        <Badge variant={getOrderStatusVariant(order.orderStatus)}>{order.orderStatus}</Badge>
                      </div>
                      <span className="font-bold text-lg sm:text-base whitespace-nowrap">R$ {order.totalAmount.toFixed(2)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 border-t bg-muted/30">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {order.items.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={48}
                                        height={48}
                                        className="rounded-md object-cover"
                                        sizes="48px"
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
                                <div className="border-t my-2"></div>
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
