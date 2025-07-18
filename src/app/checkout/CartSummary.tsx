'use client';

import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

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
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={50}
                height={50}
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
         <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
                <p>Subtotal</p>
                <p>R$ {cartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
                <p>Taxa de Entrega</p>
                <p>R$ {deliveryFee.toFixed(2)}</p>
            </div>
         </div>
      </CardContent>
      <CardFooter className="flex justify-between font-bold text-lg border-t pt-4">
        <p>Total</p>
        <p>R$ {totalWithFee.toFixed(2)}</p>
      </CardFooter>
    </Card>
  );
} 