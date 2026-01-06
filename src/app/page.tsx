'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, FilterState } from '@/types';
import { StickyFilterBar } from '@/components/StickyFilterBar';
import { SwipeDeck, SwipeDeckRef } from '@/components/SwipeDeck';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { MatchModal } from '@/components/MatchModal';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUserData } from '@/hooks/useUserData';
import { Menu, Heart, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<Product[]>([]); // Undo History
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 10000,
  });

  // Vibe Match State
  const [matchData, setMatchData] = useState<{ matches: any[], product: Product } | null>(null);

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

  // Refs for stable fetchProducts access without triggering re-renders
  const swipeDeckRef = useRef<SwipeDeckRef>(null);
  const rejectedIdsRef = useRef(rejectedIds);
  const wishlistRef = useRef(wishlist);
  const categoryScoresRef = useRef(categoryScores);

  // Sync refs with state
  useEffect(() => { rejectedIdsRef.current = rejectedIds; }, [rejectedIds]);
  useEffect(() => { wishlistRef.current = wishlist; }, [wishlist]);
  useEffect(() => { categoryScoresRef.current = categoryScores; }, [categoryScores]);

  // Fetch Products
  const fetchProducts = useCallback(async (isAppending = false) => {
    if (!isAppending) setLoading(true);

    try {
      // Use Ref values to avoid closure dependencies and redundant re-fetches
      const currentScores = categoryScoresRef.current;
      const currentRejected = rejectedIdsRef.current;
      const currentWishlist = wishlistRef.current;

      const queryParams = new URLSearchParams({
        minPrice: filters.minPrice.toString(),
        maxPrice: filters.maxPrice.toString(),
        preferences: JSON.stringify(currentScores),
      });
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.minReviews) queryParams.set('minReviews', filters.minReviews.toString());
      if (filters.minRating) queryParams.set('minRating', filters.minRating.toString());
      if (filters.maxRating) queryParams.set('maxRating', filters.maxRating.toString());

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        // High Performance Filtering
        const rejectedSet = new Set(currentRejected);
        const wishlistSet = new Set(currentWishlist.map(w => w.id));

        const filtered = data.filter((p: Product) =>
          !wishlistSet.has(p.id) && !rejectedSet.has(p.id)
        );

        if (isAppending) {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = filtered.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setProducts(filtered);
        }

        // AUTO-REFILL LOGIC
        if (filtered.length <= 5 && !isAppending) {
          console.log("Fresh content low, triggering background restock...");

          const refillParams = new URLSearchParams(queryParams);
          if (filters.category) {
            refillParams.set('refreshCategory', filters.category);
          }

          fetch(`/api/products?${refillParams.toString()}`)
            .then(res => res.json())
            .then(newData => {
              if (Array.isArray(newData)) {
                const newFiltered = newData.filter((p: Product) =>
                  !wishlistSet.has(p.id) && !rejectedSet.has(p.id)
                );
                setProducts(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const uniqueNew = newFiltered.filter(p => !existingIds.has(p.id));
                  return [...prev, ...uniqueNew];
                });
              }
            })
            .catch(err => console.error("Background refill failed", err));
        }
      } else {
        console.warn("API returned invalid data format:", data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      if (!isAppending) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // This is now safe because fetchProducts only changes when filters change

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

    // Vibe Match Logic
    if (product.friendMatches && product.friendMatches.length > 0) {
      setMatchData({ matches: product.friendMatches, product });
    }

    // Remove from main state & trigger refill if low
    setProducts(prev => {
      const remaining = prev.filter(p => p.id !== product.id);
      if (remaining.length <= 5 && !loading) {
        fetchProducts(true);
      }
      return remaining;
    });
  };

  const handleSwipeLeft = (product: Product) => {
    // 1. Add to local history stack
    setHistory(prev => [...prev, product]);

    // 2. Add to rejected IDs
    setRejectedIds(prev => [...prev, product.id]);

    // 3. Update Category Score
    updateCategoryScores({
      ...categoryScores,
      [product.category]: Math.max((categoryScores[product.category] || 1) - 0.5, 0.1)
    });

    // 4. Remove from main state & trigger refill if low
    setProducts(prev => {
      const remaining = prev.filter(p => p.id !== product.id);
      if (remaining.length <= 5 && !loading) {
        fetchProducts(true);
      }
      return remaining;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastProduct = history[history.length - 1];

    // 1. Remove from History
    setHistory(prev => prev.slice(0, -1));

    // 2. Remove from Rejected IDs (Allow it to be seen again)
    setRejectedIds(prev => prev.filter(id => id !== lastProduct.id));

    // 3. Add back to the FRONT of the product list
    setProducts(prev => [lastProduct, ...prev]);

    // 4. Optional: Revert score? (Skipping for now to keep simple)
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
    <main className="flex flex-col h-[100dvh] w-full relative bg-zinc-950 overflow-hidden text-white">

      <StickyFilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        onProfileClick={() => setIsDrawerOpen(true)}
        wishlistCount={wishlist.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-20 pb-4 px-4 w-full relative">
        <SwipeDeck
          ref={swipeDeckRef}
          products={products}
          loading={loading}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />

        {/* Undo Button - Always visible but disabled if no history */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className={cn(
            "absolute bottom-6 left-6 p-4 rounded-full shadow-lg transition-all z-50 flex items-center justify-center",
            history.length > 0
              ? "bg-zinc-800 text-yellow-400 border border-yellow-400/20 hover:scale-110 active:scale-95 cursor-pointer"
              : "bg-zinc-900/50 text-zinc-600 border border-zinc-800 cursor-not-allowed opacity-50"
          )}
          aria-label="Undo last nope"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <MatchModal
        isOpen={!!matchData}
        onClose={() => setMatchData(null)}
        matches={matchData?.matches || []}
        productImage={matchData?.product.imageUrl || ''}
      />

      <OnboardingOverlay />
    </main >
  );
}
