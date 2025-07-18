'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CartSummary() {
  const { items, cartTotal, deliveryFee, totalWithFee, clearCart } = useCart();

  if (items.length === 0) {
    return (
        <div className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Resumo do Pedido</h3>
            <p className="text-center text-muted-foreground">Seu carrinho está vazio.</p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
                <div className="flex justify-between items-center">
                    <AccordionTrigger className="flex-1 py-0">
                        <h3 className="text-lg font-semibold">Resumo do Pedido</h3>
                    </AccordionTrigger>
                    <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive text-xs">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Limpar
                    </Button>
                </div>
                <AccordionContent>
                    <div className="space-y-4 pt-4">
                        {items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                width={56}
                                height={56}
                                className="rounded-md object-cover"
                                sizes="56px"
                                style={{ height: 'auto' }}
                            />
                            <div>
                                <p className="font-semibold text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                {item.quantity} x R$ {item.price.toFixed(2)}
                                </p>
                            </div>
                            </div>
                            <p className="font-medium shrink-0 text-sm">
                            R$ {(item.price * item.quantity).toFixed(2)}
                            </p>
                        </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      
      <Separator />

      <div className="space-y-2 text-muted-foreground">
        <div className="flex justify-between">
            <p>Subtotal</p>
            <p className="text-foreground font-medium">R$ {cartTotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
            <p>Taxa de Entrega</p>
            <p className="text-foreground font-medium">R$ {deliveryFee.toFixed(2)}</p>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-lg">
        <p>Total</p>
        <p>R$ {totalWithFee.toFixed(2)}</p>
      </div>
    </div>
  );
}
