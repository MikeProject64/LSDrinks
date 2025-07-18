"use client";
import React, { useState, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import ProductModal from '@/components/ProductModal';
import Link from 'next/link';
import Image from 'next/image';

// Tipos que refletem o retorno das actions
interface Highlight { id: string; title: string; description: string; imageUrl: string; link: string; isActive: boolean; }
interface Category { id: string; name: string; }
interface Item { id: string; title: string; description: string; price: number; imageUrl: string; categoryId: string; categoryName?: string; }


interface HomePageClientProps {
  highlights: Highlight[];
  categories: Category[];
  items: Item[];
}

export default function HomePageClient({ highlights, categories, items }: HomePageClientProps) {
  const allCategories = [{ id: 'Todos', name: 'Todos' }, ...categories];
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));

  const handleProductClick = (product: Item) => { // Usando Item
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredItems = activeCategory === 'Todos' 
    ? items 
    : items.filter(item => item.categoryId === activeCategory);

  return (
    <section>
      {/* Carousel */}
      {highlights.length > 0 && (
        <div className="mb-8 relative overflow-hidden rounded-xl">
          <Carousel
            plugins={[autoplayPlugin.current]}
            onMouseEnter={() => autoplayPlugin.current.stop()}
            onMouseLeave={() => autoplayPlugin.current.play()}
          >
            <CarouselContent>
              {highlights.map((highlight, index) => (
                <CarouselItem key={highlight.id}>
                  <Link href={highlight.link} target="_blank">
                    <div className="relative w-full h-48 md:h-64 overflow-hidden shadow-md">
                      <Image 
                        src={highlight.imageUrl} 
                        alt={highlight.title} 
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="100vw"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-2/5 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full flex flex-col items-start px-4 pb-4 z-10">
                        <h2 className="text-lg font-bold text-white mb-1 drop-shadow">{highlight.title}</h2>
                        <p className="text-xs text-white mb-2 drop-shadow line-clamp-2">{highlight.description}</p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            {highlights.length > 1 && (
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                <div className="progress-bar h-full" style={{ animationDuration: '5s' }}></div>
              </div>
            )}
          </Carousel>
          <style jsx>{`
            .progress-bar {
              animation: progress linear infinite;
              background-color: hsl(var(--primary));
            }
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Categories */}
      <nav className="flex justify-center mb-6">
        <ul className="flex gap-2 bg-transparent overflow-x-auto scrollbar-hide whitespace-nowrap max-w-full px-1">
          {allCategories.map((cat) => (
            <li key={cat.id}>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-w-[90px] border border-border shadow-sm
                  ${activeCategory === cat.id ? 'bg-accent text-accent-foreground' : 'bg-card text-muted-foreground hover:bg-accent/20'}
                `}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Products */}
      <div className="flex flex-col gap-4">
        {filteredItems.map((item) => (
          <ProductCard 
            key={item.id} 
            product={item as any} 
            onProductClick={() => handleProductClick(item)} 
          />
        ))}
      </div>

      <ProductModal 
        product={selectedProduct as any}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}