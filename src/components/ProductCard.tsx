'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { name, image, description, price, dataAiHint } = product;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            data-ai-hint={dataAiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-2">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-2xl font-bold text-primary">${price.toFixed(2)}</p>
        <Button onClick={() => addToCart(product)} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
          <ShoppingCart className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
