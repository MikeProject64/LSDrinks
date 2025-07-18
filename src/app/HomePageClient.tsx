"use client";
import React, { useState, useRef, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { getItemsPaginated } from '@/actions/item-actions';

const ProductModal = dynamic(() => import('@/components/ProductModal'), { ssr: false });

interface Highlight { id: string; title: string; description: string; imageUrl: string; link: string; isActive: boolean; }
interface Category { id: string; name: string; }
interface Item { id: string; title: string; description: string; price: number; imageUrl: string; categoryId: string; categoryName?: string; }

interface HomePageClientProps {
  highlights: Highlight[];
  categories: Category[];
  initialItems: Item[];
  initialLastVisibleId: string | null;
  initialHasMore: boolean;
}

const AnimatedProductCard = ({ product, onProductClick }: { product: Item; onProductClick: (product: Item) => void; }) => {
    const ref = useRef<HTMLDivElement>(null);
    const entry = useIntersectionObserver(ref, { threshold: 0.1, freezeOnceVisible: true });
    const isVisible = !!entry?.isIntersecting;
  
    return (
      <div 
        ref={ref}
        className={`transition-all duration-700 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <ProductCard product={product} onProductClick={onProductClick} />
      </div>
    );
};

export default function HomePageClient({ highlights, categories, initialItems, initialLastVisibleId, initialHasMore }: HomePageClientProps) {
  const allCategories = [{ id: 'Todos', name: 'Todos' }, ...categories];
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [items, setItems] = useState<Item[]>(initialItems);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(initialLastVisibleId);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const categoryChangeRef = useRef(false);

  useEffect(() => {
    if (categoryChangeRef.current) {
      setItems(initialItems);
      setLastVisibleId(initialLastVisibleId);
      setHasMore(initialHasMore);
      categoryChangeRef.current = false;
    }
  }, [initialItems, initialLastVisibleId, initialHasMore]);

  const handleCategoryChange = (categoryId: string) => {
    categoryChangeRef.current = true;
    setActiveCategory(categoryId);
    // This will cause a re-render which triggers the effect above
    // to reset items based on the new props from the server for that category.
    // For "All", we handle it client-side.
    if (categoryId !== 'Todos') {
      // Logic for filtered initial load would go here if we were to fetch category-specific items from server
      setItems(initialItems.filter(item => item.categoryId === categoryId));
      setHasMore(false); // Disable "load more" for specific categories for now
    } else {
      setItems(initialItems);
      setHasMore(initialHasMore);
      setLastVisibleId(initialLastVisibleId);
    }
  };
  
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const result = await getItemsPaginated({ lastVisibleId });
      if (result.items.length > 0) {
        setItems(prevItems => [...prevItems, ...result.items]);
        setLastVisibleId(result.lastVisibleId);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more items:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }));

  const handleProductClick = (product: Item) => { 
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

  const HighlightContent = ({ highlight, index }: { highlight: Highlight, index: number }) => (
    <div className="relative w-full h-48 md:h-64 overflow-hidden shadow-md">
      <Image 
        src={highlight.imageUrl} 
        alt={highlight.title} 
        fill
        className="object-cover"
        priority={index === 0}
        loading={index === 0 ? 'eager' : 'lazy'}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute bottom-0 left-0 w-full h-2/5 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-start px-4 pb-4 z-10">
        <h2 className="text-lg font-bold text-white mb-1 drop-shadow">{highlight.title}</h2>
        <p className="text-xs text-white mb-2 drop-shadow line-clamp-2">{highlight.description}</p>
      </div>
    </div>
  );

  return (
    <section>
      {/* Carousel */}
      {highlights.length > 0 && (
        <div className="mb-8 relative overflow-hidden rounded-xl">
          <Carousel
            plugins={[autoplayPlugin.current]}
            onMouseEnter={autoplayPlugin.current.stop}
            onMouseLeave={autoplayPlugin.current.reset}
          >
            <CarouselContent>
              {highlights.map((highlight, index) => (
                <CarouselItem key={highlight.id}>
                  {highlight.link ? (
                    <Link href={highlight.link} target="_blank">
                      <HighlightContent highlight={highlight} index={index} />
                    </Link>
                  ) : (
                    <HighlightContent highlight={highlight} index={index} />
                  )}
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
                onClick={() => handleCategoryChange(cat.id)}
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
           <AnimatedProductCard 
             key={item.id} 
             product={item} 
             onProductClick={() => handleProductClick(item)} 
           />
        ))}
      </div>

       {/* Load More Button */}
       {activeCategory === 'Todos' && hasMore && (
        <div className="flex justify-center mt-8">
          <Button onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Ver Mais'
            )}
          </Button>
        </div>
      )}

      <ProductModal 
        product={selectedProduct as any}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}
