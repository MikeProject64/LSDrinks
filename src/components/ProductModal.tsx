'use client';

import React, { useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: `${quantity}x ${product.title} adicionado!`,
      description: "Seu carrinho foi atualizado.",
    });
    onClose();
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-11/12 sm:max-w-[425px] p-0">
        <div className="relative w-full h-48">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 640px) 90vw, 425px"
          />
        </div>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">{product.title}</DialogTitle>
          <DialogDescription className="text-base">
            {product.description}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2 pb-4">
          <div className="flex items-center justify-center gap-4 my-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button onClick={handleAddToCart} className="w-full" size="lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Adicionar (R${(product.price * quantity).toFixed(2)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal; 
