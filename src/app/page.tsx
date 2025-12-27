'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, FilterState } from '@/types';
import { StickyFilterBar } from '@/components/StickyFilterBar';
import { SwipeDeck, SwipeDeckRef } from '@/components/SwipeDeck';
import { WishlistDrawer } from '@/components/WishlistDrawer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUserData } from '@/hooks/useUserData';
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

  const {
    wishlist,
    categoryScores,
    rejectedIds,
    setRejectedIds,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    updateCategoryScores
  } = useUserData();

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
        preferences: JSON.stringify(categoryScores),
      });
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.minReviews) queryParams.set('minReviews', filters.minReviews.toString());
      if (filters.minRating) queryParams.set('minRating', filters.minRating.toString());
      if (filters.maxRating) queryParams.set('maxRating', filters.maxRating.toString());

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
      addToWishlist(product);
    }

    // Update Category Score (Boost liked category)
    updateCategoryScores({
      ...categoryScores,
      [product.category]: (categoryScores[product.category] || 1) + 1
    });

    // Remove from main state to keep in sync
    setProducts(prev => prev.filter(p => p.id !== product.id));
  };

  const handleSwipeLeft = (product: Product) => {
    setRejectedIds(prev => [...prev, product.id]);

    // Update Category Score (Slight penalty for noped category, but don't go below 0.1)
    updateCategoryScores({
      ...categoryScores,
      [product.category]: Math.max((categoryScores[product.category] || 1) - 0.5, 0.1)
    });

    setProducts(prev => prev.filter(p => p.id !== product.id));
  };

  const handleRemoveFromWishlist = (id: string) => {
    removeFromWishlist(id);
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
    <main className="flex flex-col h-screen w-full relative bg-zinc-950 overflow-hidden text-white">

      <StickyFilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        onProfileClick={() => setIsDrawerOpen(true)}
        wishlistCount={wishlist.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-28 pb-10 px-4 w-full">
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
        onClear={clearWishlist}
      />
    </main>
  );
}
