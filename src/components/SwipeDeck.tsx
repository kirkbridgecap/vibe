'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Product } from '@/types';
import { SwipeCard } from './SwipeCard';
import { AnimatePresence } from 'framer-motion';

export interface SwipeDeckRef {
    swipe: (direction: 'left' | 'right') => void;
}

interface SwipeDeckProps {
    products: Product[];
    onSwipeRight: (product: Product) => void;
    onSwipeLeft: (product: Product) => void;
    loading?: boolean;
}

export const SwipeDeck = forwardRef<SwipeDeckRef, SwipeDeckProps>(({ products: initialProducts, onSwipeRight, onSwipeLeft, loading }, ref) => {
    const [visibleProducts, setVisibleProducts] = useState(initialProducts);
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        setVisibleProducts(initialProducts);
    }, [initialProducts]);

    useImperativeHandle(ref, () => ({
        swipe: (direction: 'left' | 'right') => {
            if (visibleProducts.length === 0) return;
            const product = visibleProducts[0];
            handleSwipe(direction, product);
        }
    }));

    const handleSwipe = (direction: 'left' | 'right', product: Product) => {
        setExitDirection(direction);

        // Call props
        if (direction === 'right') {
            onSwipeRight(product);
        } else {
            onSwipeLeft(product);
        }

        // Remove the card from the visible stack
        setVisibleProducts((prev) => prev.filter((p) => p.id !== product.id));
    };

    if (loading) {
        return (
            <div className="relative w-full max-w-sm aspect-[2/3] md:aspect-[3/5] animate-pulse">
                <div className="absolute inset-0 bg-zinc-900 rounded-3xl border border-zinc-800" />
                <div className="absolute inset-x-8 top-1/4 h-64 bg-zinc-800 rounded-xl" />
            </div>
        );
    }

    if (visibleProducts.length === 0) {
        return (
            <div className="relative w-full max-w-sm aspect-[2/3] md:aspect-[3/5] flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-800">
                <p className="text-center p-8">
                    No more products matching your filters.<br />Try adjusting them!
                </p>
            </div>
        );
    }

    // We only render the top 3 cards for performance and stacking effect
    const activeCards = visibleProducts.slice(0, 3);

    return (
        <div className="relative w-full max-w-sm aspect-[2/3] md:aspect-[3/5]">
            <AnimatePresence custom={exitDirection}>
                {activeCards.map((product, index) => {
                    const isTop = index === 0;
                    return (
                        <SwipeCard
                            key={product.id}
                            product={product}
                            onSwipe={(dir) => handleSwipe(dir, product)}
                            drag={isTop}
                            custom={isTop ? exitDirection : undefined}
                            style={{
                                zIndex: activeCards.length - index,
                                y: index * 10,
                                scale: 1 - index * 0.05,
                            }}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
});

SwipeDeck.displayName = 'SwipeDeck';
