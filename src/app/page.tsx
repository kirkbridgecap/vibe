'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, FilterState } from '@/types';
import { StickyFilterBar } from '@/components/StickyFilterBar';
import { SwipeDeck, SwipeDeckRef } from '@/components/SwipeDeck';
import { WishlistDrawer } from '@/components/WishlistDrawer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Menu, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 10000,
  });

  const [wishlist, setWishlist] = useLocalStorage<Product[]>('giftpulse-wishlist', []);
  const [rejectedIds, setRejectedIds] = useLocalStorage<string[]>('giftpulse-rejected', []);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Refs
  const swipeDeckRef = useRef<SwipeDeckRef>(null);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        minPrice: filters.minPrice.toString(),
        maxPrice: filters.maxPrice.toString(),
      });
      if (filters.category) queryParams.set('category', filters.category);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      const data: Product[] = await res.json();

      // Filter out products already in wishlist or rejected list
      const filtered = data.filter(p =>
        !wishlist.find(w => w.id === p.id) &&
        !rejectedIds.includes(p.id)
      );

      setProducts(filtered);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handlers
  const handleSwipeRight = (product: Product) => {
    // Avoid duplicates
    if (!wishlist.find(p => p.id === product.id)) {
      setWishlist(prev => [...prev, product]);
    }
    // Remove from main state to keep in sync
    setProducts(prev => prev.filter(p => p.id !== product.id));
  };

  const handleSwipeLeft = (product: Product) => {
    setRejectedIds(prev => [...prev, product.id]);
    setProducts(prev => prev.filter(p => p.id !== product.id));
  };

  const handleRemoveFromWishlist = (id: string) => {
    setWishlist(prev => prev.filter(p => p.id !== id));
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (products.length === 0 || loading || isDrawerOpen) return;

      // Use ref to trigger internal swipe animation in Deck
      if (e.key === 'ArrowRight') {
        swipeDeckRef.current?.swipe('right');
      } else if (e.key === 'ArrowLeft') {
        swipeDeckRef.current?.swipe('left');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, loading, isDrawerOpen]);

  return (
    <main className="flex flex-col h-screen w-full relative bg-zinc-950 overflow-hidden">

      <StickyFilterBar filters={filters} onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} />



      {/* Floating Wishlist Button (Mobile/Desktop) */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="absolute top-20 right-4 z-40 bg-zinc-900 border border-zinc-700 p-3 rounded-full shadow-lg hover:border-brand transition-colors group"
      >
        <div className="relative">
          <Heart className={cn("text-zinc-400 group-hover:text-brand transition-colors", wishlist.length > 0 && "fill-brand text-brand")} />
          {wishlist.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {wishlist.length}
            </span>
          )}
        </div>
      </button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-10 px-4 w-full">
        <SwipeDeck
          ref={swipeDeckRef}
          products={products}
          loading={loading}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />

        {/* Hint Text */}
        <div className="mt-8 flex gap-8 text-zinc-500 text-sm font-medium opacity-50">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">←</span>
            <span>Nope</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Like</span>
            <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">→</span>
          </div>
        </div>
      </div>

      <WishlistDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        wishlist={wishlist}
        onRemove={handleRemoveFromWishlist}
      />
    </main>
  );
}
