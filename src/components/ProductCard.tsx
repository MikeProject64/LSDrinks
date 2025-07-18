'use client';

import Image from 'next/image';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { title, imageUrl, description, price } = product;

  return (
    <button 
      onClick={() => onProductClick(product)}
      className="w-full text-left flex items-center gap-4 p-3 rounded-lg bg-card border border-transparent hover:border-primary/50 transition-colors group"
    >
      {/* Informações do Produto */}
      <div className="flex-1 flex flex-col gap-1">
        <h3 className="font-semibold text-base text-foreground line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <span className="text-base font-bold text-primary">R${price.toFixed(2)}</span>
      </div>
      
      {/* Imagem do Produto */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-md overflow-hidden bg-muted shrink-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 96px, 112px"
          className="object-cover"
        />
      </div>
    </button>
  );
};

export default ProductCard;
