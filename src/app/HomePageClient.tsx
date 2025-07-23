
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { getItemsPaginated, searchItems } from '@/actions/item-actions';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  // Ref para o elemento de carregamento (gatilho do scroll infinito)
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(loadMoreRef, { threshold: 0.5 });


  // Estados para a busca
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    // Quando os itens iniciais mudam (navegação), reseta o estado.
    setItems(initialItems);
    setLastVisibleId(initialLastVisibleId);
    setHasMore(initialHasMore);
  }, [initialItems, initialLastVisibleId, initialHasMore]);

  // Novo: Buscar itens do banco ao trocar de categoria
  useEffect(() => {
    const fetchCategoryItems = async () => {
      if (activeCategory === 'Todos') return;
      setIsLoadingCategory(true);
      try {
        // Busca todos os itens da categoria (sem paginação inicial)
        const result = await getItemsPaginated({ pageLimit: 1000, categoryId: activeCategory });
        setItems(result.items);
        setLastVisibleId(result.lastVisibleId);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Erro ao buscar itens da categoria:', error);
        setItems([]);
        setLastVisibleId(null);
        setHasMore(false);
      } finally {
        setIsLoadingCategory(false);
      }
    };
    if (activeCategory !== 'Todos') {
      fetchCategoryItems();
    } else {
      // Volta para os itens iniciais ao selecionar 'Todos'
      setItems(initialItems);
      setLastVisibleId(initialLastVisibleId);
      setHasMore(initialHasMore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);
  
  // Novo: Efeito para lidar com a busca
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setIsSearchActive(false);
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      setIsSearchActive(true);
      try {
        const results = await searchItems({ query: searchQuery });
        setSearchResults(results);
      } catch (error) {
        console.error('Erro ao buscar itens:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce para evitar buscas a cada tecla digitada
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLoadMore = useCallback(async () => {
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
  }, [hasMore, isLoadingMore, lastVisibleId]);

  // Efeito para carregar mais itens ao rolar (scroll infinito)
  useEffect(() => {
    if (entry?.isIntersecting && !isLoadingMore && !isSearchActive) {
      handleLoadMore();
    }
  }, [entry, isLoadingMore, isSearchActive, handleLoadMore]);

  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }));

  const handleProductClick = (product: Item) => { 
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Remover o filtro local:
  const filteredItems = items;

  const itemsToDisplay = isSearchActive ? searchResults : filteredItems;

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

      {/* Barra de Busca */}
      <div className="mb-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nome do produto..."
          className="w-full pl-10 h-12 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>


      {/* Categorias */}
      {!isSearchActive && (
        <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex justify-center mb-6">
            <ul className="flex gap-2 bg-transparent overflow-x-auto scrollbar-hide whitespace-nowrap max-w-full px-1">
              {allCategories.map((category) => (
                <li key={category.id}>
                  <Button
                    variant={activeCategory === category.id ? "default" : "outline"}
                    onClick={() => setActiveCategory(category.id)}
                    className="rounded-full px-4 py-2 text-sm"
                  >
                    {category.name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid de Produtos */}
      <div className="space-y-4">
        {isSearching ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
          </div>
        ) : (
          itemsToDisplay.length > 0 ? (
            itemsToDisplay.map((item) => (
              <AnimatedProductCard 
                key={item.id} 
                product={item} 
                onProductClick={() => handleProductClick(item)} 
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {isSearchActive ? 'Nenhum resultado encontrado para sua busca.' : 'Não há itens nesta categoria.'}
            </p>
          )
        )}
      </div>

      {/* Loader para Infinite Scroll - substitui o botão */}
      {!isSearchActive && hasMore && (
        <div ref={loadMoreRef} className="flex justify-center mt-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Modal de Produto */}
      {isModalOpen && selectedProduct && (
        <ProductModal 
          product={selectedProduct as any}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
}
