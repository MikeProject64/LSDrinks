"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { products } from '@/lib/data';
import type { Product } from '@/types';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import ProductModal from '@/components/ProductModal';

export default function Home() {
  const categorias = ['Todos', 'Drinks', 'Mocktails', 'Sem Álcool', 'Exóticos'];
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <section>
      {/* Carrossel de Destaques */}
      <div className="mb-8 relative overflow-hidden rounded-xl">
        <Carousel
          plugins={[plugin.current]}
          onMouseEnter={() => plugin.current.stop()}
          onMouseLeave={() => plugin.current.play()}
        >
          <CarouselContent>
            {products.slice(0, 3).map((product) => (
              <CarouselItem key={product.id}>
                <div className="relative w-full h-48 md:h-64 overflow-hidden shadow-md">
                  <img src={product.image} alt={product.name} className="object-cover w-full h-full absolute inset-0" />
                  <div className="absolute bottom-0 left-0 w-full h-2/5 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full flex flex-col items-start px-4 pb-4 z-10">
                    <h2 className="text-lg font-bold text-white mb-1 drop-shadow">{product.name}</h2>
                    <p className="text-xs text-white mb-2 drop-shadow line-clamp-2">{product.description}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* A barra de progresso é animada via CSS com a keyframe 'progress' */}
          <style jsx>{`
            .progress-bar {
              animation: progress 5s linear infinite;
              background-color: var(--accent-color, #fff); /* Cor padrão branca, pode ser sobrescrita */
            }
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
          <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
            <div className="progress-bar h-full" style={{ ['--accent-color' as string]: 'hsl(var(--primary))' }}></div>
          </div>
        </Carousel>
      </div>
      {/* Título e menu de categorias */}
      <nav className="flex justify-center mb-6">
        <ul className="flex gap-2 bg-transparent overflow-x-auto scrollbar-hide whitespace-nowrap max-w-full px-1">
          {categorias.map((cat) => (
            <li key={cat}>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-w-[90px] border border-border shadow-sm
                  ${categoriaAtiva === cat ? 'bg-accent text-accent-foreground' : 'bg-card text-muted-foreground hover:bg-accent/20'}
                `}
                onClick={() => setCategoriaAtiva(cat)}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {/* Título e lista de produtos */}
      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onProductClick={handleProductClick} />
        ))}
      </div>
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}
