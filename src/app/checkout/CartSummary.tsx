'use client';

import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

export default function CartSummary() {
  const { items, cartTotal, deliveryFee, totalWithFee } = useCart();

  if (items.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">Seu carrinho está vazio.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="border rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium">Itens do Pedido</h3>
      </div>
      <div className="px-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={64}
                height={64}
                className="rounded-md object-cover"
              />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} x R$ {item.price.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="font-medium shrink-0">
              R$ {(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <Separator className="my-6" />
      <div className="px-6 space-y-2 text-muted-foreground">
        <div className="flex justify-between">
            <p>Subtotal</p>
            <p className="text-foreground">R$ {cartTotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
            <p>Taxa de Entrega</p>
            <p className="text-foreground">R$ {deliveryFee.toFixed(2)}</p>
        </div>
      </div>
      <Separator className="my-6" />
      <div className="p-6 flex justify-between font-bold text-lg">
        <p>Total</p>
        <p>R$ {totalWithFee.toFixed(2)}</p>
      </div>
    </div>
  );
}